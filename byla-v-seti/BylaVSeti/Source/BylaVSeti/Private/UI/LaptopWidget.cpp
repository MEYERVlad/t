#include "UI/LaptopWidget.h"

#include "Blueprint/WidgetTree.h"
#include "Case/CaseStateSubsystem.h"
#include "Components/Border.h"
#include "Components/Button.h"
#include "Components/EditableTextBox.h"
#include "Components/HorizontalBox.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/ScrollBox.h"
#include "Components/ScrollBoxSlot.h"
#include "Components/SizeBox.h"
#include "Components/Spacer.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Engine/GameInstance.h"
#include "Gameplay/DetectivePlayerController.h"
#include "InputCoreTypes.h"
#include "Stream/TwitchChatSubsystem.h"
#include "UI/BoardWidget.h"
#include "UI/UIStyle.h"

namespace
{
	const FName ActClose(TEXT("close"));
	const FName ActApp(TEXT("app"));
	const FName ActDecide(TEXT("decide"));
	const FName ActPoll(TEXT("poll"));
	const FName ActConnect(TEXT("connect"));
	const FName ActDisconnect(TEXT("disconnect"));

	constexpr float PollSeconds = 60.f;

	struct FAppInfo
	{
		ELaptopApp App;
		const TCHAR* Id;
		const TCHAR* UIKey;
	};
	const FAppInfo Apps[] = {
		{ ELaptopApp::Case, TEXT("case"), TEXT("app_case") },
		{ ELaptopApp::Krug, TEXT("krug"), TEXT("app_krug") },
		{ ELaptopApp::Mail, TEXT("mail"), TEXT("app_mail") },
		{ ELaptopApp::Board, TEXT("board"), TEXT("app_board") },
		{ ELaptopApp::Decisions, TEXT("decisions"), TEXT("app_decisions") },
		{ ELaptopApp::Stream, TEXT("stream"), TEXT("app_stream") },
	};

	FString Bar(int32 Count, int32 Total)
	{
		const int32 Width = Total > 0 ? FMath::RoundToInt(20.f * Count / Total) : 0;
		return FString::ChrN(Width, TEXT('|')) + FString::ChrN(20 - Width, TEXT('.'));
	}
}

// ================================================================ Жизненный цикл

void ULaptopWidget::NativeOnInitialized()
{
	Super::NativeOnInitialized();
	SetIsFocusable(true);
}

void ULaptopWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (UTwitchChatSubsystem* Twitch = GetTwitch())
	{
		// Голоса и таймер голосования перерисовывают только «Решения» и «Стрим».
		TwitchHandle = Twitch->OnChanged.AddWeakLambda(this, [this]()
		{
			if (CurrentApp == ELaptopApp::Decisions || CurrentApp == ELaptopApp::Stream)
			{
				MarkDirty();
			}
		});
	}
}

void ULaptopWidget::NativeDestruct()
{
	if (UTwitchChatSubsystem* Twitch = GetTwitch())
	{
		Twitch->OnChanged.Remove(TwitchHandle);
	}
	Super::NativeDestruct();
}

FReply ULaptopWidget::NativeOnKeyDown(const FGeometry& InGeometry, const FKeyEvent& InKeyEvent)
{
	const FKey Key = InKeyEvent.GetKey();
	if (Key == EKeys::Tab || Key == EKeys::Escape)
	{
		HandleAction(ActClose, NAME_None);
		return FReply::Handled();
	}
	return Super::NativeOnKeyDown(InGeometry, InKeyEvent);
}

UTwitchChatSubsystem* ULaptopWidget::GetTwitch() const
{
	const UGameInstance* GI = GetGameInstance();
	return GI ? GI->GetSubsystem<UTwitchChatSubsystem>() : nullptr;
}

void ULaptopWidget::AddContent(UWidget* Widget, float BottomPadding)
{
	if (UScrollBoxSlot* S = Cast<UScrollBoxSlot>(Content->AddChild(Widget)))
	{
		S->SetPadding(FMargin(0.f, 0.f, 0.f, BottomPadding));
	}
}

// ================================================================ Каркас

void ULaptopWidget::BuildLayout()
{
	UBorder* Root = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass(), TEXT("LaptopRoot"));
	Root->SetBrushColor(BylaUI::Background);
	Root->SetPadding(FMargin(36.f, 28.f));
	WidgetTree->RootWidget = Root;

	UVerticalBox* Column = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	Root->SetContent(Column);

	// Шапка: название системы, доверие, кнопка «Закрыть».
	UHorizontalBox* Header = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
	if (UHorizontalBoxSlot* S = Header->AddChildToHorizontalBox(MakeText(UI(TEXT("laptop_title")), 26, BylaUI::Accent, true, false)))
	{
		S->SetVerticalAlignment(VAlign_Center);
	}
	if (UHorizontalBoxSlot* S = Header->AddChildToHorizontalBox(WidgetTree->ConstructWidget<USpacer>(USpacer::StaticClass())))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}
	TrustText = MakeText(FText::GetEmpty(), 22, BylaUI::Warning, true, false);
	if (UHorizontalBoxSlot* S = Header->AddChildToHorizontalBox(TrustText))
	{
		S->SetVerticalAlignment(VAlign_Center);
		S->SetPadding(FMargin(0.f, 0.f, 24.f, 0.f));
	}
	Header->AddChildToHorizontalBox(MakeButton(UI(TEXT("close")), ActClose, NAME_None, BylaUI::Danger, true));
	if (UVerticalBoxSlot* S = Column->AddChildToVerticalBox(Header))
	{
		S->SetPadding(FMargin(0.f, 0.f, 0.f, 18.f));
	}

	// Тело: меню приложений слева, содержимое справа.
	UHorizontalBox* Body = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());

	USizeBox* NavSize = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	NavSize->SetWidthOverride(260.f);
	NavBox = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	NavSize->AddChild(NavBox);
	if (UHorizontalBoxSlot* S = Body->AddChildToHorizontalBox(NavSize))
	{
		S->SetPadding(FMargin(0.f, 0.f, 24.f, 0.f));
	}

	ContentPanel = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
	ContentPanel->SetBrushColor(BylaUI::Panel);
	ContentPanel->SetPadding(FMargin(24.f, 20.f));
	Content = WidgetTree->ConstructWidget<UScrollBox>(UScrollBox::StaticClass());
	ContentPanel->SetContent(Content);
	if (UHorizontalBoxSlot* S = Body->AddChildToHorizontalBox(ContentPanel))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}

	if (UVerticalBoxSlot* S = Column->AddChildToVerticalBox(Body))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}

	// Доска и поле канала создаются один раз и живут, пока открыт ноутбук.
	Board = WidgetTree->ConstructWidget<UBoardWidget>(UBoardWidget::StaticClass());
	ChannelInput = WidgetTree->ConstructWidget<UEditableTextBox>(UEditableTextBox::StaticClass());
	ChannelInput->SetHintText(UI(TEXT("stream_channel_hint")));
	if (const UTwitchChatSubsystem* Twitch = GetTwitch())
	{
		ChannelInput->SetText(FText::FromString(Twitch->GetChannel()));
	}

	Refresh();
}

void ULaptopWidget::BuildNav()
{
	NavBox->ClearChildren();
	const UCaseStateSubsystem* Case = GetCase();

	for (const FAppInfo& Info : Apps)
	{
		FText Label = UI(Info.UIKey);
		// Счётчик доступных решений, чтобы игрок их не пропустил.
		if (Info.App == ELaptopApp::Decisions && Case)
		{
			const int32 Count = Case->GetAvailableDecisions().Num();
			if (Count > 0)
			{
				Label = FText::Format(FText::FromString(TEXT("{0}  ({1})")), Label, FText::AsNumber(Count));
			}
		}
		const FLinearColor Color = (Info.App == CurrentApp) ? BylaUI::ButtonActive : BylaUI::Button;
		if (UVerticalBoxSlot* S = NavBox->AddChildToVerticalBox(MakeButton(Label, ActApp, FName(Info.Id), Color)))
		{
			S->SetPadding(FMargin(0.f, 0.f, 0.f, 10.f));
			S->SetHorizontalAlignment(HAlign_Fill);
		}
	}
}

void ULaptopWidget::Refresh()
{
	if (!Content || !NavBox)
	{
		return;
	}
	ResetContentButtons();
	BuildNav();

	if (const UCaseStateSubsystem* Case = GetCase())
	{
		TrustText->SetText(FText::Format(FText::FromString(TEXT("{0}: {1}")), UI(TEXT("trust")), FText::AsNumber(Case->GetTrust())));
	}

	// Доска занимает всю панель, остальные приложения — прокручиваемый список.
	if (CurrentApp == ELaptopApp::Board)
	{
		if (Board && Board->GetParent() != ContentPanel.Get())
		{
			ContentPanel->SetContent(Board);
		}
		if (Board)
		{
			Board->MarkDirty();
		}
		return;
	}
	if (Content->GetParent() != ContentPanel.Get())
	{
		ContentPanel->SetContent(Content);
	}

	Content->ClearChildren();
	switch (CurrentApp)
	{
	case ELaptopApp::Case:      BuildCaseApp(); break;
	case ELaptopApp::Krug:      BuildFeedApp(TEXT("krug")); break;
	case ELaptopApp::Mail:      BuildFeedApp(TEXT("mail")); break;
	case ELaptopApp::Decisions: BuildDecisionsApp(); break;
	case ELaptopApp::Stream:    BuildStreamApp(); break;
	default: break;
	}
}

// ================================================================ Приложения

void ULaptopWidget::BuildCaseApp()
{
	const UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}
	const TArray<FName>& Known = Case->GetKnownEvidence();
	AddContent(MakeText(FText::Format(UI(TEXT("case_header")), FText::AsNumber(Known.Num())), 28, BylaUI::Text, true), 18.f);

	// Новые улики сверху.
	for (int32 i = Known.Num() - 1; i >= 0; --i)
	{
		const FCaseEvidence* E = Case->FindEvidence(Known[i]);
		if (!E)
		{
			continue;
		}
		UVerticalBox* Box = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		Box->AddChildToVerticalBox(MakeText(UI(*FString::Printf(TEXT("kind_%s"), *E->Kind.ToString())), 16, BylaUI::Accent, true));
		if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeText(E->Title, 23, BylaUI::Text, true)))
		{
			S->SetPadding(FMargin(0.f, 4.f, 0.f, 6.f));
		}
		Box->AddChildToVerticalBox(MakeText(E->Description, 19, BylaUI::TextDim));
		AddContent(MakeCard(Box, BylaUI::Card));
	}
}

void ULaptopWidget::BuildFeedApp(FName Channel)
{
	const UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}
	const bool bMail = Channel == TEXT("mail");
	AddContent(MakeText(UI(bMail ? TEXT("mail_header") : TEXT("krug_header")), 28, BylaUI::Text, true), 18.f);

	const TArray<const FCaseFeedItem*> Items = Case->GetPublishedFeed(Channel);
	if (Items.Num() == 0)
	{
		AddContent(MakeText(UI(TEXT("feed_empty")), 20, BylaUI::TextDim));
		return;
	}

	for (const FCaseFeedItem* Item : Items)
	{
		UVerticalBox* Box = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		UHorizontalBox* Top = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
		Top->AddChildToHorizontalBox(MakeText(Item->Author, 21, BylaUI::Accent, true, false));
		if (UHorizontalBoxSlot* S = Top->AddChildToHorizontalBox(MakeText(FText::FromString(Item->DateLabel), 17, BylaUI::TextDim, false, false)))
		{
			S->SetPadding(FMargin(16.f, 3.f, 0.f, 0.f));
		}
		Box->AddChildToVerticalBox(Top);
		if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeText(Item->Text, 22, BylaUI::Text)))
		{
			S->SetPadding(FMargin(0.f, 8.f, 0.f, 0.f));
		}
		AddContent(MakeCard(Box, BylaUI::Card));
	}
}

void ULaptopWidget::BuildDecisionsApp()
{
	const UCaseStateSubsystem* Case = GetCase();
	const UTwitchChatSubsystem* Twitch = GetTwitch();
	if (!Case)
	{
		return;
	}
	AddContent(MakeText(UI(TEXT("decisions_header")), 28, BylaUI::Text, true), 18.f);

	const TArray<const FCaseDecision*> Available = Case->GetAvailableDecisions();
	if (Available.Num() == 0)
	{
		AddContent(MakeText(UI(TEXT("decisions_none")), 20, BylaUI::TextDim));
		return;
	}

	for (const FCaseDecision* D : Available)
	{
		UVerticalBox* Box = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		auto Add = [Box](UWidget* W, float Bottom)
		{
			if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(W))
			{
				S->SetPadding(FMargin(0.f, 0.f, 0.f, Bottom));
				S->SetHorizontalAlignment(HAlign_Left);
			}
		};

		if (D->bPointOfNoReturn)
		{
			Add(MakeText(UI(TEXT("decision_pnr")), 17, BylaUI::Danger, true), 4.f);
		}
		Add(MakeText(D->Prompt, 24, BylaUI::Text, true), 6.f);
		Add(MakeText(D->Description, 19, BylaUI::TextDim), 14.f);

		// Голосование чата.
		const bool bPollHere = Twitch && Twitch->IsPollRunning() && Twitch->GetPollId() == D->Id;
		TArray<int32> Counts;
		const bool bHasResult = Twitch && Twitch->GetPollResultCounts(D->Id, Counts);
		if (bPollHere)
		{
			Counts = Twitch->GetPollCounts();
		}
		int32 Total = 0;
		for (const int32 C : Counts)
		{
			Total += C;
		}

		for (int32 i = 0; i < D->Options.Num(); ++i)
		{
			const FName Payload(*FString::Printf(TEXT("%s#%d"), *D->Id.ToString(), i));
			const FText Label = FText::Format(FText::FromString(TEXT("{0})  {1}")), FText::AsNumber(i + 1), D->Options[i].Label);
			Add(MakeButton(Label, ActDecide, Payload, BylaUI::Button), (bPollHere || bHasResult) ? 2.f : 8.f);

			if ((bPollHere || bHasResult) && Counts.IsValidIndex(i))
			{
				const FText Votes = FText::Format(FText::FromString(TEXT("{0}  {1}")), FText::FromString(Bar(Counts[i], Total)), FText::AsNumber(Counts[i]));
				Add(MakeText(Votes, 18, BylaUI::Accent, true, false), 10.f);
			}
		}

		if (bPollHere)
		{
			Add(MakeText(FText::Format(UI(TEXT("poll_running")), FText::AsNumber(Twitch->GetPollSecondsLeft())), 20, BylaUI::Warning, true), 4.f);
		}
		else if (bHasResult)
		{
			const int32 Winner = Twitch->GetPollWinner(D->Id);
			if (D->Options.IsValidIndex(Winner))
			{
				Add(MakeText(FText::Format(UI(TEXT("poll_result")), D->Options[Winner].Label, FText::AsNumber(Counts[Winner]), FText::AsNumber(Total)), 20, BylaUI::Good, true), 4.f);
			}
			else
			{
				Add(MakeText(UI(TEXT("poll_no_votes")), 20, BylaUI::TextDim), 4.f);
			}
		}
		else if (Twitch && Twitch->IsConnected())
		{
			Add(MakeButton(UI(TEXT("poll_start")), ActPoll, D->Id, BylaUI::ButtonActive), 4.f);
		}
		else
		{
			Add(MakeText(UI(TEXT("poll_needs_twitch")), 17, BylaUI::TextDim), 4.f);
		}

		AddContent(MakeCard(Box, BylaUI::Card));
	}
}

void ULaptopWidget::BuildStreamApp()
{
	const UTwitchChatSubsystem* Twitch = GetTwitch();
	AddContent(MakeText(UI(TEXT("stream_header")), 28, BylaUI::Text, true), 10.f);
	AddContent(MakeText(UI(TEXT("stream_help")), 19, BylaUI::TextDim), 18.f);

	USizeBox* InputSize = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	InputSize->SetWidthOverride(420.f);
	InputSize->AddChild(ChannelInput);
	AddContent(InputSize, 10.f);

	UHorizontalBox* Row = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
	if (UHorizontalBoxSlot* S = Row->AddChildToHorizontalBox(MakeButton(UI(TEXT("stream_connect")), ActConnect, NAME_None, BylaUI::ButtonActive)))
	{
		S->SetPadding(FMargin(0.f, 0.f, 10.f, 0.f));
	}
	Row->AddChildToHorizontalBox(MakeButton(UI(TEXT("stream_disconnect")), ActDisconnect, NAME_None, BylaUI::Button));
	AddContent(Row, 16.f);

	FText Status = UI(TEXT("stream_status_off"));
	FLinearColor Color = BylaUI::TextDim;
	if (Twitch)
	{
		switch (Twitch->GetStatus())
		{
		case ETwitchStatus::Connecting:
			Status = UI(TEXT("stream_status_connecting"));
			Color = BylaUI::Warning;
			break;
		case ETwitchStatus::Connected:
			Status = FText::Format(UI(TEXT("stream_status_connected")), FText::FromString(Twitch->GetChannel()));
			Color = BylaUI::Good;
			break;
		case ETwitchStatus::Error:
			Status = FText::Format(UI(TEXT("stream_status_error")), FText::FromString(Twitch->GetLastError()));
			Color = BylaUI::Danger;
			break;
		default:
			break;
		}
	}
	AddContent(MakeCard(MakeText(Status, 21, Color, true), BylaUI::Card), 12.f);
}

// ================================================================ Действия

void ULaptopWidget::HandleAction(FName Action, FName Payload)
{
	UCaseStateSubsystem* Case = GetCase();
	UTwitchChatSubsystem* Twitch = GetTwitch();

	if (Action == ActClose)
	{
		if (ADetectivePlayerController* PC = Cast<ADetectivePlayerController>(GetOwningPlayer()))
		{
			PC->ClosePanel();
		}
		return;
	}

	if (Action == ActApp)
	{
		for (const FAppInfo& Info : Apps)
		{
			if (Payload == FName(Info.Id))
			{
				CurrentApp = Info.App;
			}
		}
	}
	else if (Action == ActDecide && Case)
	{
		FString DecisionId;
		FString Index;
		if (Payload.ToString().Split(TEXT("#"), &DecisionId, &Index))
		{
			if (Twitch && Twitch->IsPollRunning() && Twitch->GetPollId() == FName(*DecisionId))
			{
				Twitch->StopPoll();
			}
			Case->ChooseDecision(FName(*DecisionId), FCString::Atoi(*Index));
		}
	}
	else if (Action == ActPoll && Case && Twitch)
	{
		for (const FCaseDecision* D : Case->GetAvailableDecisions())
		{
			if (D->Id == Payload)
			{
				Twitch->StartPoll(D->Id, D->Options.Num(), PollSeconds);
			}
		}
	}
	else if (Action == ActConnect && Twitch && ChannelInput)
	{
		Twitch->Connect(ChannelInput->GetText().ToString());
	}
	else if (Action == ActDisconnect && Twitch)
	{
		Twitch->Disconnect();
	}

	MarkDirty();
}
