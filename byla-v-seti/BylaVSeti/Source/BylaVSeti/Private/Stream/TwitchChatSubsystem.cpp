#include "Stream/TwitchChatSubsystem.h"

#include "Engine/GameInstance.h"
#include "IWebSocket.h"
#include "Modules/ModuleManager.h"
#include "TimerManager.h"
#include "WebSocketsModule.h"

DEFINE_LOG_CATEGORY_STATIC(LogTwitch, Log, All);

namespace TwitchChat
{
	static const TCHAR* Url = TEXT("wss://irc-ws.chat.twitch.tv:443");

	static FString NormalizeChannel(const FString& Input)
	{
		FString Channel = Input.TrimStartAndEnd().ToLower();
		int32 Slash = INDEX_NONE;
		if (Channel.FindLastChar(TEXT('/'), Slash))
		{
			Channel = Channel.Mid(Slash + 1);
		}
		Channel.RemoveFromStart(TEXT("#"));
		Channel.RemoveFromStart(TEXT("@"));
		Channel.ReplaceInline(TEXT(" "), TEXT(""));
		return Channel;
	}
}

void UTwitchChatSubsystem::Deinitialize()
{
	Disconnect();
	Super::Deinitialize();
}

void UTwitchChatSubsystem::Connect(const FString& Channel)
{
	Disconnect();

	ChannelName = TwitchChat::NormalizeChannel(Channel);
	if (ChannelName.IsEmpty())
	{
		Status = ETwitchStatus::Error;
		LastError = TEXT("empty channel");
		OnChanged.Broadcast();
		return;
	}
	SaveConfig();

	FWebSocketsModule& Module = FModuleManager::LoadModuleChecked<FWebSocketsModule>(TEXT("WebSockets"));
	Socket = Module.CreateWebSocket(TwitchChat::Url, FString());
	Socket->OnConnected().AddUObject(this, &UTwitchChatSubsystem::HandleConnected);
	Socket->OnConnectionError().AddUObject(this, &UTwitchChatSubsystem::HandleConnectionError);
	Socket->OnClosed().AddUObject(this, &UTwitchChatSubsystem::HandleClosed);
	Socket->OnMessage().AddUObject(this, &UTwitchChatSubsystem::HandleMessage);

	Status = ETwitchStatus::Connecting;
	LastError.Reset();
	OnChanged.Broadcast();
	Socket->Connect();
}

void UTwitchChatSubsystem::Disconnect()
{
	if (Socket.IsValid())
	{
		Socket->OnConnected().RemoveAll(this);
		Socket->OnConnectionError().RemoveAll(this);
		Socket->OnClosed().RemoveAll(this);
		Socket->OnMessage().RemoveAll(this);
		if (Socket->IsConnected())
		{
			Socket->Close();
		}
		Socket.Reset();
	}
	if (Status != ETwitchStatus::Off)
	{
		Status = ETwitchStatus::Off;
		OnChanged.Broadcast();
	}
}

void UTwitchChatSubsystem::HandleConnected()
{
	// Анонимный вход только на чтение: ник justinfanNNNNN, пароль не нужен.
	const FString Nick = FString::Printf(TEXT("justinfan%d"), FMath::RandRange(10000, 99999));
	Socket->Send(TEXT("PASS SCHMOOPIIE"));
	Socket->Send(FString::Printf(TEXT("NICK %s"), *Nick));
	Socket->Send(FString::Printf(TEXT("JOIN #%s"), *ChannelName));

	Status = ETwitchStatus::Connected;
	UE_LOG(LogTwitch, Log, TEXT("Connected to #%s"), *ChannelName);
	OnChanged.Broadcast();
}

void UTwitchChatSubsystem::HandleConnectionError(const FString& Error)
{
	Status = ETwitchStatus::Error;
	LastError = Error;
	UE_LOG(LogTwitch, Warning, TEXT("Connection error: %s"), *Error);
	OnChanged.Broadcast();
}

void UTwitchChatSubsystem::HandleClosed(int32 StatusCode, const FString& Reason, bool bWasClean)
{
	Status = bWasClean ? ETwitchStatus::Off : ETwitchStatus::Error;
	LastError = Reason;
	UE_LOG(LogTwitch, Log, TEXT("Closed (%d): %s"), StatusCode, *Reason);
	OnChanged.Broadcast();
}

void UTwitchChatSubsystem::HandleMessage(const FString& Message)
{
	TArray<FString> Lines;
	Message.ParseIntoArrayLines(Lines);
	for (const FString& Line : Lines)
	{
		if (Line.StartsWith(TEXT("PING")))
		{
			if (Socket.IsValid())
			{
				Socket->Send(TEXT("PONG :tmi.twitch.tv"));
			}
			continue;
		}

		// :user!user@user.tmi.twitch.tv PRIVMSG #channel :text
		const int32 PrivIndex = Line.Find(TEXT(" PRIVMSG #"), ESearchCase::CaseSensitive);
		if (PrivIndex == INDEX_NONE || !Line.StartsWith(TEXT(":")))
		{
			continue;
		}
		const int32 Bang = Line.Find(TEXT("!"), ESearchCase::CaseSensitive);
		const int32 TextStart = Line.Find(TEXT(" :"), ESearchCase::CaseSensitive, ESearchDir::FromStart, PrivIndex);
		if (Bang <= 1 || TextStart == INDEX_NONE)
		{
			continue;
		}
		HandleChatLine(Line.Mid(1, Bang - 1), Line.Mid(TextStart + 2));
	}
}

void UTwitchChatSubsystem::HandleChatLine(const FString& User, const FString& Text)
{
	if (!bPollRunning)
	{
		return;
	}
	FString Vote = Text.TrimStartAndEnd();
	Vote.RemoveFromStart(TEXT("!"));
	if (Vote.Len() != 1 || !FChar::IsDigit(Vote[0]))
	{
		return;
	}
	const int32 Option = Vote[0] - TEXT('1');
	if (Option < 0 || Option >= NumPollOptions)
	{
		return;
	}
	Voters.Add(User, Option);
	RecountVotes();
	OnChanged.Broadcast();
}

void UTwitchChatSubsystem::RecountVotes()
{
	Counts.Init(0, NumPollOptions);
	for (const TPair<FString, int32>& Pair : Voters)
	{
		if (Counts.IsValidIndex(Pair.Value))
		{
			++Counts[Pair.Value];
		}
	}
}

bool UTwitchChatSubsystem::StartPoll(FName PollId, int32 NumOptions, float Seconds)
{
	UGameInstance* GI = GetGameInstance();
	if (!IsConnected() || bPollRunning || NumOptions < 2 || NumOptions > 9 || !GI)
	{
		return false;
	}
	bPollRunning = true;
	ActivePollId = PollId;
	NumPollOptions = NumOptions;
	Voters.Reset();
	RecountVotes();

	FTimerManager& Timers = GI->GetTimerManager();
	Timers.SetTimer(PollTimer, FTimerDelegate::CreateUObject(this, &UTwitchChatSubsystem::FinishPoll), Seconds, false);
	Timers.SetTimer(PollTickTimer, FTimerDelegate::CreateUObject(this, &UTwitchChatSubsystem::PollTick), 1.f, true);
	OnChanged.Broadcast();
	return true;
}

void UTwitchChatSubsystem::PollTick()
{
	OnChanged.Broadcast();
}

void UTwitchChatSubsystem::FinishPoll()
{
	if (!bPollRunning)
	{
		return;
	}
	bPollRunning = false;
	if (UGameInstance* GI = GetGameInstance())
	{
		GI->GetTimerManager().ClearTimer(PollTimer);
		GI->GetTimerManager().ClearTimer(PollTickTimer);
	}
	PollResults.Add(ActivePollId, Counts);
	OnChanged.Broadcast();
}

void UTwitchChatSubsystem::StopPoll()
{
	FinishPoll();
}

int32 UTwitchChatSubsystem::GetPollSecondsLeft() const
{
	const UGameInstance* GI = GetGameInstance();
	if (!bPollRunning || !GI)
	{
		return 0;
	}
	return FMath::CeilToInt(GI->GetTimerManager().GetTimerRemaining(PollTimer));
}

int32 UTwitchChatSubsystem::GetPollWinner(FName PollId) const
{
	const TArray<int32>* Result = PollResults.Find(PollId);
	if (!Result)
	{
		return -1;
	}
	int32 Best = -1;
	int32 BestCount = 0;
	for (int32 i = 0; i < Result->Num(); ++i)
	{
		if ((*Result)[i] > BestCount)
		{
			Best = i;
			BestCount = (*Result)[i];
		}
	}
	return Best;
}

bool UTwitchChatSubsystem::GetPollResultCounts(FName PollId, TArray<int32>& OutCounts) const
{
	if (const TArray<int32>* Result = PollResults.Find(PollId))
	{
		OutCounts = *Result;
		return true;
	}
	return false;
}
