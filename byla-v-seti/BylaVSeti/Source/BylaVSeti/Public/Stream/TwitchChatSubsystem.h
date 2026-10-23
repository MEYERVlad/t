#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "TwitchChatSubsystem.generated.h"

class IWebSocket;

enum class ETwitchStatus : uint8
{
	Off,
	Connecting,
	Connected,
	Error
};

/**
 * Twitch-чат для голосований. Подключается анонимно (только чтение), ключи и пароли не нужны.
 * Зритель голосует, написав в чат цифру варианта: 1, 2, ... (или !1, !2).
 * Засчитывается последний голос каждого зрителя.
 */
UCLASS(config = Game)
class BYLAVSETI_API UTwitchChatSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	DECLARE_MULTICAST_DELEGATE(FOnTwitchChanged);
	/** Подключение, новый голос, тик таймера, конец голосования. */
	FOnTwitchChanged OnChanged;

	virtual void Initialize(FSubsystemCollectionBase& Collection) override;
	virtual void Deinitialize() override;

	/** Канал можно указать как "name", "#name" или ссылкой twitch.tv/name. Запоминается для автоподключения. */
	void Connect(const FString& Channel);
	/** Отключение по кнопке: автоподключение при следующем запуске выключается. */
	void UserDisconnect();

	ETwitchStatus GetStatus() const { return Status; }
	bool IsConnected() const { return Status == ETwitchStatus::Connected; }
	const FString& GetChannel() const { return ChannelName; }
	const FString& GetLastError() const { return LastError; }

	// --- Голосование ---
	bool StartPoll(FName PollId, const FText& Title, const TArray<FText>& Options, float Seconds);
	const FText& GetPollTitle() const { return PollTitle; }
	const TArray<FText>& GetPollOptions() const { return PollOptions; }
	/** Последнее завершённое голосование (для показа итога). */
	FName GetLastFinishedPollId() const { return LastFinishedPollId; }
	void StopPoll();
	bool IsPollRunning() const { return bPollRunning; }
	FName GetPollId() const { return ActivePollId; }
	const TArray<int32>& GetPollCounts() const { return Counts; }
	int32 GetPollSecondsLeft() const;

	/** Итог завершённого голосования: индекс победителя или -1. */
	int32 GetPollWinner(FName PollId) const;
	bool GetPollResultCounts(FName PollId, TArray<int32>& OutCounts) const;

private:
	void Disconnect();
	void HandleConnected();
	void HandleConnectionError(const FString& Error);
	void HandleClosed(int32 StatusCode, const FString& Reason, bool bWasClean);
	void HandleMessage(const FString& Message);
	void HandleChatLine(const FString& User, const FString& Text);
	void FinishPoll();
	void PollTick();
	void RecountVotes();

	UPROPERTY(Config)
	FString ChannelName;

	UPROPERTY(Config)
	bool bAutoConnect = false;

	FText PollTitle;
	TArray<FText> PollOptions;
	FName LastFinishedPollId;

	TSharedPtr<IWebSocket> Socket;
	ETwitchStatus Status = ETwitchStatus::Off;
	FString LastError;

	bool bPollRunning = false;
	FName ActivePollId;
	int32 NumPollOptions = 0;
	TArray<int32> Counts;
	TMap<FString, int32> Voters;
	FTimerHandle PollTimer;
	FTimerHandle PollTickTimer;

	TMap<FName, TArray<int32>> PollResults;
};
