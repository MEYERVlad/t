#include "UI/InterrogationWidget.h"

#include "Audio/VoiceSubsystem.h"
#include "Blueprint/WidgetTree.h"
#include "Case/CaseStateSubsystem.h"
#include "Components/Border.h"
#include "Components/Button.h"
#include "Components/HorizontalBox.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/ScrollBox.h"
#include "Components/Spacer.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Components/WrapBox.h"
#include "Components/WrapBoxSlot.h"
#include "Engine/GameInstance.h"
#include "EngineUtils.h"
#include "Gameplay/CaseObjectActor.h"
#include "Gameplay/DetectivePlayerController.h"
#include "InputCoreTypes.h"
#include "UI/UIStyle.h"

namespace
{
	const FName ActClose(TEXT("close"));
	const FName ActPrev(TEXT("prev"));
	const FName ActNext(TEXT("next"));
	const FName ActPresentMode(TEXT("present_mode"));
	const FName ActPresent(TEXT("present"));
	const FName ActCancel(TEXT("cancel"));
}

void UInterrogationWidget::NativeOnInitialized()
{
	Super::NativeOnInitialized();
	SetIsFocusable(true);
}

void UInterrogationWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (UCaseStateSubsystem* Case = GetCase())
	{
		FeedHandle = Case->OnFeedPublished.AddUObject(this, &UInterrogationWidget::HandleFeedPublished);
	}
	PlayCurrentStatement();
}

AActor* UInterrogationWidget::FindSpeaker()
{
	if (Speaker.IsValid())
	{
		return Speaker.Get();
	}
	const UCaseStateSubsystem* Case = GetCase();
	UWorld* World = GetWorld();
	if (!Case || !World)
	{
		return nullptr;
	}
	// Предмет дела, который открывает этот допрос, — серый цилиндр; на нём записан персонаж MetaHuman.
	for (TActorIterator<ACaseObjectActor> It(World); It; ++It)
	{
		const FCaseObject* Object = Case->FindObject(It->ObjectId);
		if (!Object || Object->InterrogationId != InterrogationId)
		{
			continue;
		}
		for (AActor* Linked : It->LinkedActors)
		{
			if (UVoiceSubsystem::FindFace(Linked))
			{
				Speaker = Linked;
				return Linked;
			}
		}
	}
	return nullptr;
}

void UInterrogationWidget::PlayVoice(FName VoiceId)
{
	if (UGameInstance* GI = GetGameInstance())
	{
		if (UVoiceSubsystem* Voice = GI->GetSubsystem<UVoiceSubsystem>())
		{
			Voice->Play(VoiceId, FindSpeaker());
		}
	}
}

void UInterrogationWidget::PlayCurrentStatement()
{
	const UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}
	const TArray<const FCaseStatement*> Statements = Case->GetVisibleStatements(InterrogationId);
	if (Statements.IsValidIndex(Index))
	{
		PlayVoice(UVoiceSubsystem::StatementId(InterrogationId, Statements[Index]->Id));
	}
}

void UInterrogationWidget::NativeDestruct()
{
	if (UCaseStateSubsystem* Case = GetCase())
	{
		Case->OnFeedPublished.Remove(FeedHandle);
	}
	if (UGameInstance* GI = GetGameInstance())
	{
		if (UVoiceSubsystem* Voice = GI->GetSubsystem<UVoiceSubsystem>())
		{
			Voice->Stop();
		}
	}
	Super::NativeDestruct();
}

FReply UInterrogationWidget::NativeOnKeyDown(const FGeometry& InGeometry, const FKeyEvent& InKeyEvent)
{
	const FKey Key = InKeyEvent.GetKey();
	if (Key == EKeys::Tab || Key == EKeys::Escape)
	{
		HandleAction(ActClose, NAME_None);
		return FReply::Handled();
	}
	if (Key == EKeys::Left || Key == EKeys::A)
	{
		HandleAction(ActPrev, NAME_None);
		return FReply::Handled();
	}
	if (Key == EKeys::Right || Key == EKeys::D)
	{
		HandleAction(ActNext, NAME_None);
		return FReply::Handled();
	}
	return Super::NativeOnKeyDown(InGeometry, InKeyEvent);
}

void UInterrogationWidget::HandleFeedPublished(FName FeedId)
{
	const UCaseStateSubsystem* Case = GetCase();
	const FCaseFeedItem* Item = Case ? Case->FindFeedItem(FeedId) : nullptr;
	const FCaseInterrogation* I = Case ? Case->FindInterrogation(InterrogationId) : nullptr;
	if (!Item || !I)
	{
		return;
	}

	LiveBanner = FText::Format(UI(TEXT("live_banner")), Item->Author, Item->Text);
	LiveReaction = FText::GetEmpty();
	for (const FCaseLiveReaction& R : I->LiveReactions)
	{
		if (R.FeedId == FeedId)
		{
			LiveReaction = FText::Format(FText::FromString(TEXT("{0}: {1}")), I->Person, R.Text);
			PlayVoice(UVoiceSubsystem::LiveId(InterrogationId, FeedId));
		}
	}
	MarkDirty();
}

void UInterrogationWidget::AddBody(UWidget* Widget, float BottomPadding)
{
	if (UVerticalBoxSlot* S = Body->AddChildToVerticalBox(Widget))
	{
		S->SetPadding(FMargin(0.f, 0.f, 0.f, BottomPadding));
	}
}

void UInterrogationWidget::BuildLayout()
{
	UBorder* Root = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass(), TEXT("InterrogationRoot"));
	Root->SetBrushColor(FLinearColor(0.012f, 0.014f, 0.02f, 0.94f));
	Root->SetPadding(FMargin(80.f, 40.f));
	WidgetTree->RootWidget = Root;

	UVerticalBox* Column = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	Root->SetContent(Column);

	UHorizontalBox* Header = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
	TitleText = MakeText(FText::GetEmpty(), 30, BylaUI::Accent, true, false);
	if (UHorizontalBoxSlot* S = Header->AddChildToHorizontalBox(TitleText))
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
	Header->AddChildToHorizontalBox(MakeButton(UI(TEXT("interrogation_close")), ActClose, NAME_None, BylaUI::Danger, true));
	if (UVerticalBoxSlot* S = Column->AddChildToVerticalBox(Header))
	{
		S->SetPadding(FMargin(0.f, 0.f, 0.f, 24.f));
	}

	BodyScroll = WidgetTree->ConstructWidget<UScrollBox>(UScrollBox::StaticClass());
	Body = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	BodyScroll->AddChild(Body);
	if (UVerticalBoxSlot* S = Column->AddChildToVerticalBox(BodyScroll))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}

	Refresh();
}

void UInterrogationWidget::Refresh()
{
	if (!Body)
	{
		return;
	}
	ResetContentButtons();
	Body->ClearChildren();

	const UCaseStateSubsystem* Case = GetCase();
	const FCaseInterrogation* I = Case ? Case->FindInterrogation(InterrogationId) : nullptr;
	if (!I)
	{
		AddBody(MakeText(FText::FromName(InterrogationId), 24, BylaUI::Danger));
		return;
	}

	TitleText->SetText(FText::Format(UI(TEXT("interrogation_title")), I->Person));
	TrustText->SetText(FText::Format(FText::FromString(TEXT("{0}: {1}")), UI(TEXT("trust")), FText::AsNumber(Case->GetTrust())));

	// Пост, пришедший прямо во время допроса.
	if (!LiveBanner.IsEmpty())
	{
		UVerticalBox* Box = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		Box->AddChildToVerticalBox(MakeText(LiveBanner, 22, BylaUI::Warning, true));
		if (!LiveReaction.IsEmpty())
		{
			if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeText(LiveReaction, 21, BylaUI::Text)))
			{
				S->SetPadding(FMargin(0.f, 8.f, 0.f, 0.f));
			}
		}
		AddBody(MakeCard(Box, FLinearColor(0.20f, 0.12f, 0.03f, 1.f)));
	}

	AddBody(MakeText(I->Intro, 19, BylaUI::TextDim), 18.f);

	if (Case->IsInterrogationFinished(InterrogationId))
	{
		AddBody(MakeCard(MakeText(I->FinishText, 21, BylaUI::Good, true), BylaUI::Card));
	}

	const TArray<const FCaseStatement*> Statements = Case->GetVisibleStatements(InterrogationId);
	if (Statements.Num() == 0)
	{
		return;
	}
	Index = FMath::Clamp(Index, 0, Statements.Num() - 1);
	const FCaseStatement* Current = Statements[Index];
	const bool bBroken = Case->IsStatementBroken(InterrogationId, Current->Id);

	// Текущее показание.
	{
		UVerticalBox* Box = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		Box->AddChildToVerticalBox(MakeText(FText::Format(UI(TEXT("statement_counter")), FText::AsNumber(Index + 1), FText::AsNumber(Statements.Num())), 17, BylaUI::Accent, true));
		if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeText(FText::Format(UI(TEXT("statement_quote")), Current->Text), 30, BylaUI::Text, true)))
		{
			S->SetPadding(FMargin(0.f, 10.f, 0.f, 0.f));
		}
		if (bBroken)
		{
			if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeText(UI(TEXT("statement_broken")), 18, BylaUI::Good, true)))
			{
				S->SetPadding(FMargin(0.f, 14.f, 0.f, 4.f));
			}
			Box->AddChildToVerticalBox(MakeText(FText::Format(FText::FromString(TEXT("{0}: {1}")), I->Person, Current->Reaction), 21, BylaUI::Text));
		}
		AddBody(MakeCard(Box, BylaUI::Card, 22.f));
	}

	// Ответ на последнее предъявление.
	if (!LastReaction.IsEmpty())
	{
		const FText Text = bLastCorrect
			? FText::Format(FText::FromString(TEXT("{0}: {1}")), I->Person, LastReaction)
			: FText::Format(UI(TEXT("present_wrong")), I->Person, LastReaction);
		AddBody(MakeCard(MakeText(Text, 21, bLastCorrect ? BylaUI::Good : BylaUI::Warning, true), BylaUI::Card));
	}

	// Кнопки.
	UHorizontalBox* Row = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
	auto AddButton = [Row](UButton* B)
	{
		if (UHorizontalBoxSlot* S = Row->AddChildToHorizontalBox(B))
		{
			S->SetPadding(FMargin(0.f, 0.f, 12.f, 0.f));
		}
	};
	AddButton(MakeButton(UI(TEXT("statement_prev")), ActPrev, NAME_None, BylaUI::Button));
	AddButton(MakeButton(UI(TEXT("statement_next")), ActNext, NAME_None, BylaUI::Button));
	if (!bBroken && !bPresenting)
	{
		AddButton(MakeButton(UI(TEXT("present")), ActPresentMode, NAME_None, BylaUI::ButtonActive));
	}
	AddBody(Row, 18.f);

	// Выбор улики.
	if (bPresenting && !bBroken)
	{
		AddBody(MakeText(UI(TEXT("present_header")), 21, BylaUI::Accent, true), 8.f);
		UWrapBox* Cards = WidgetTree->ConstructWidget<UWrapBox>(UWrapBox::StaticClass());
		for (const FName& Id : Case->GetKnownEvidence())
		{
			if (const FCaseEvidence* E = Case->FindEvidence(Id))
			{
				if (UWrapBoxSlot* S = Cards->AddChildToWrapBox(MakeButton(E->Title, ActPresent, Id, BylaUI::Button, false, 18)))
				{
					S->SetPadding(FMargin(0.f, 0.f, 8.f, 8.f));
				}
			}
		}
		if (UWrapBoxSlot* S = Cards->AddChildToWrapBox(MakeButton(UI(TEXT("present_cancel")), ActCancel, NAME_None, BylaUI::Danger, false, 18)))
		{
			S->SetPadding(FMargin(0.f, 0.f, 8.f, 8.f));
		}
		AddBody(Cards);
	}
}

void UInterrogationWidget::HandleAction(FName Action, FName Payload)
{
	UCaseStateSubsystem* Case = GetCase();

	if (Action == ActClose)
	{
		if (ADetectivePlayerController* PC = Cast<ADetectivePlayerController>(GetOwningPlayer()))
		{
			PC->ClosePanel();
		}
		return;
	}

	if (Action == ActPrev)
	{
		--Index;
		bPresenting = false;
		LastReaction = FText::GetEmpty();
	}
	else if (Action == ActNext)
	{
		++Index;
		bPresenting = false;
		LastReaction = FText::GetEmpty();
	}
	else if (Action == ActPresentMode)
	{
		bPresenting = true;
	}
	else if (Action == ActCancel)
	{
		bPresenting = false;
	}
	else if (Action == ActPresent && Case)
	{
		const TArray<const FCaseStatement*> Statements = Case->GetVisibleStatements(InterrogationId);
		if (Statements.IsValidIndex(Index))
		{
			const FCaseStatement* Statement = Statements[Index];
			const FCasePresentResult Result = Case->PresentEvidence(InterrogationId, Statement->Id, Payload);
			PlayVoice(UVoiceSubsystem::ReactionId(InterrogationId, Statement->Id, Result.bCorrect, !Statement->WrongReaction.IsEmpty()));
			bLastCorrect = Result.bCorrect;
			// При верном ответе реакция уже показана в карточке показания.
			LastReaction = Result.bCorrect ? FText::GetEmpty() : Result.Reaction;
			bJustFinished = Result.bFinished;
		}
		bPresenting = false;
	}

	// Перелистывание по кругу.
	if (Case)
	{
		const int32 Count = Case->GetVisibleStatements(InterrogationId).Num();
		if (Count > 0)
		{
			Index = (Index % Count + Count) % Count;
		}
	}
	if (Action == ActPrev || Action == ActNext)
	{
		PlayCurrentStatement();
	}
	MarkDirty();
}
