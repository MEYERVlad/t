#include "UI/PollOverlayWidget.h"

#include "Blueprint/WidgetTree.h"
#include "Case/CaseStateSubsystem.h"
#include "Components/Border.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Components/SizeBox.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"
#include "Stream/TwitchChatSubsystem.h"
#include "UI/UIStyle.h"

namespace
{
	UTwitchChatSubsystem* TwitchOf(const UUserWidget* W)
	{
		const UGameInstance* GI = W ? W->GetGameInstance() : nullptr;
		return GI ? GI->GetSubsystem<UTwitchChatSubsystem>() : nullptr;
	}

	FString Bar(int32 Count, int32 Total)
	{
		const int32 Width = Total > 0 ? FMath::RoundToInt(24.f * Count / Total) : 0;
		return FString::ChrN(Width, TEXT('|')) + FString::ChrN(24 - Width, TEXT('.'));
	}
}

FText UPollOverlayWidget::UI(const TCHAR* Key) const
{
	const UGameInstance* GI = GetGameInstance();
	const UCaseStateSubsystem* Case = GI ? GI->GetSubsystem<UCaseStateSubsystem>() : nullptr;
	return Case ? Case->UI(FName(Key)) : FText::FromString(Key);
}

TSharedRef<SWidget> UPollOverlayWidget::RebuildWidget()
{
	if (WidgetTree && !WidgetTree->RootWidget)
	{
		BuildLayout();
	}
	return Super::RebuildWidget();
}

void UPollOverlayWidget::BuildLayout()
{
	UCanvasPanel* Canvas = WidgetTree->ConstructWidget<UCanvasPanel>(UCanvasPanel::StaticClass(), TEXT("PollCanvas"));
	WidgetTree->RootWidget = Canvas;
	SetVisibility(ESlateVisibility::HitTestInvisible);

	USizeBox* Size = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	Size->SetWidthOverride(720.f);

	Panel = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
	Panel->SetBrushColor(FLinearColor(0.05f, 0.02f, 0.10f, 0.92f));
	Panel->SetPadding(FMargin(24.f, 18.f));
	Rows = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	Panel->SetContent(Rows);
	Size->AddChild(Panel);

	if (UCanvasPanelSlot* S = Canvas->AddChildToCanvas(Size))
	{
		S->SetAnchors(FAnchors(0.5f, 0.f));
		S->SetAlignment(FVector2D(0.5f, 0.f));
		S->SetAutoSize(true);
		S->SetPosition(FVector2D(0.f, 24.f));
	}
	Rebuild();
}

void UPollOverlayWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (UTwitchChatSubsystem* Twitch = TwitchOf(this))
	{
		TwitchHandle = Twitch->OnChanged.AddUObject(this, &UPollOverlayWidget::HandleTwitchChanged);
	}
	bDirty = true;
}

void UPollOverlayWidget::NativeDestruct()
{
	if (UTwitchChatSubsystem* Twitch = TwitchOf(this))
	{
		Twitch->OnChanged.Remove(TwitchHandle);
	}
	Super::NativeDestruct();
}

void UPollOverlayWidget::HandleTwitchChanged()
{
	const UTwitchChatSubsystem* Twitch = TwitchOf(this);
	const UWorld* World = GetWorld();
	// Голосование только что закончилось — держим итог на экране.
	if (Twitch && World && !Twitch->IsPollRunning() && !Twitch->GetLastFinishedPollId().IsNone()
		&& Twitch->GetLastFinishedPollId() != ShownResultPoll)
	{
		ShownResultPoll = Twitch->GetLastFinishedPollId();
		ResultHideTime = World->GetTimeSeconds() + ResultSeconds;
	}
	bDirty = true;
}

void UPollOverlayWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
	Super::NativeTick(MyGeometry, InDeltaTime);
	const UWorld* World = GetWorld();
	if (ResultHideTime > 0.0 && World && World->GetTimeSeconds() >= ResultHideTime)
	{
		ResultHideTime = 0.0;
		bDirty = true;
	}
	if (bDirty)
	{
		bDirty = false;
		Rebuild();
	}
}

void UPollOverlayWidget::Rebuild()
{
	if (!Rows || !Panel)
	{
		return;
	}
	Rows->ClearChildren();

	const UTwitchChatSubsystem* Twitch = TwitchOf(this);
	const bool bRunning = Twitch && Twitch->IsPollRunning();
	const bool bShowResult = Twitch && !bRunning && ResultHideTime > 0.0;
	if (!bRunning && !bShowResult)
	{
		Panel->SetVisibility(ESlateVisibility::Collapsed);
		return;
	}
	Panel->SetVisibility(ESlateVisibility::HitTestInvisible);

	auto AddText = [this](const FText& Text, int32 Size, const FLinearColor& Color, bool bBold, float Bottom)
	{
		UTextBlock* T = WidgetTree->ConstructWidget<UTextBlock>(UTextBlock::StaticClass());
		T->SetText(Text);
		T->SetFont(BylaUI::Font(Size, bBold));
		T->SetColorAndOpacity(FSlateColor(Color));
		T->SetAutoWrapText(true);
		if (UVerticalBoxSlot* S = Rows->AddChildToVerticalBox(T))
		{
			S->SetPadding(FMargin(0.f, 0.f, 0.f, Bottom));
		}
	};

	TArray<int32> Counts;
	if (bRunning)
	{
		Counts = Twitch->GetPollCounts();
	}
	else
	{
		Twitch->GetPollResultCounts(ShownResultPoll, Counts);
	}
	int32 Total = 0;
	for (const int32 C : Counts)
	{
		Total += C;
	}

	const FLinearColor Purple(0.75f, 0.55f, 1.f, 1.f);
	AddText(UI(TEXT("overlay_title")), 16, Purple, true, 4.f);
	AddText(Twitch->GetPollTitle(), 24, BylaUI::Text, true, 10.f);

	const TArray<FText>& Options = Twitch->GetPollOptions();
	const int32 Winner = bRunning ? -1 : Twitch->GetPollWinner(ShownResultPoll);
	for (int32 i = 0; i < Options.Num(); ++i)
	{
		const int32 Count = Counts.IsValidIndex(i) ? Counts[i] : 0;
		const FText Line = FText::Format(FText::FromString(TEXT("{0})  {1}")), FText::AsNumber(i + 1), Options[i]);
		AddText(Line, 20, i == Winner ? BylaUI::Good : BylaUI::Text, i == Winner, 2.f);
		AddText(FText::Format(FText::FromString(TEXT("{0}   {1}")), FText::FromString(Bar(Count, Total)), FText::AsNumber(Count)), 18, Purple, true, 8.f);
	}

	if (bRunning)
	{
		AddText(FText::Format(UI(TEXT("overlay_hint")), FText::AsNumber(Twitch->GetPollSecondsLeft()), FText::AsNumber(Total)), 18, BylaUI::Warning, true, 0.f);
	}
	else if (Options.IsValidIndex(Winner))
	{
		AddText(FText::Format(UI(TEXT("overlay_result")), Options[Winner]), 20, BylaUI::Good, true, 0.f);
	}
	else
	{
		AddText(UI(TEXT("poll_no_votes")), 20, BylaUI::TextDim, false, 0.f);
	}
}
