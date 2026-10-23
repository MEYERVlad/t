#include "UI/EndingWidget.h"

#include "Blueprint/WidgetTree.h"
#include "Case/CaseStateSubsystem.h"
#include "Components/Border.h"
#include "Components/Button.h"
#include "Components/HorizontalBox.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/ScrollBox.h"
#include "Components/SizeBox.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Gameplay/DetectivePlayerController.h"
#include "InputCoreTypes.h"
#include "Kismet/GameplayStatics.h"
#include "UI/UIStyle.h"

namespace
{
	const FName ActClose(TEXT("close"));
	const FName ActRestartAsk(TEXT("restart_ask"));
	const FName ActRestart(TEXT("restart"));
	const FName CourtId(TEXT("court"));
}

void UEndingWidget::NativeOnInitialized()
{
	Super::NativeOnInitialized();
	SetIsFocusable(true);
}

FReply UEndingWidget::NativeOnKeyDown(const FGeometry& InGeometry, const FKeyEvent& InKeyEvent)
{
	if (InKeyEvent.GetKey() == EKeys::Tab || InKeyEvent.GetKey() == EKeys::Escape)
	{
		HandleAction(ActClose, NAME_None);
		return FReply::Handled();
	}
	return Super::NativeOnKeyDown(InGeometry, InKeyEvent);
}

void UEndingWidget::BuildLayout()
{
	UBorder* Root = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass(), TEXT("EndingRoot"));
	Root->SetBrushColor(FLinearColor(0.f, 0.f, 0.f, 0.97f));
	Root->SetPadding(FMargin(0.f, 60.f));
	Root->SetHorizontalAlignment(HAlign_Center);
	WidgetTree->RootWidget = Root;

	USizeBox* Width = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	Width->SetWidthOverride(1000.f);
	UScrollBox* Scroll = WidgetTree->ConstructWidget<UScrollBox>(UScrollBox::StaticClass());
	Body = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	Scroll->AddChild(Body);
	Width->AddChild(Scroll);
	Root->SetContent(Width);

	Refresh();
}

void UEndingWidget::Refresh()
{
	if (!Body)
	{
		return;
	}
	ResetContentButtons();
	Body->ClearChildren();

	const UCaseStateSubsystem* Case = GetCase();
	const FCaseEnding* Ending = Case ? Case->FindEnding(EndingId) : nullptr;
	if (!Ending)
	{
		return;
	}

	auto Add = [this](UWidget* W, float Bottom)
	{
		if (UVerticalBoxSlot* S = Body->AddChildToVerticalBox(W))
		{
			S->SetPadding(FMargin(0.f, 0.f, 0.f, Bottom));
		}
	};

	Add(MakeText(UI(TEXT("ending_label")), 20, BylaUI::TextDim, true), 10.f);
	Add(MakeText(Ending->Title, 54, BylaUI::Text, true), 28.f);
	Add(MakeText(Ending->Text, 24, BylaUI::Text), 36.f);

	// Статистика дела.
	const FText Stats = FText::Format(UI(TEXT("ending_stats")),
		FText::AsNumber(Case->CountBrokenStatements(CourtId)),
		FText::AsNumber(Case->CountStatements(CourtId)),
		FText::AsNumber(Case->GetKnownEvidence().Num()),
		FText::AsNumber(Case->GetTrust()));
	Add(MakeCard(MakeText(Stats, 21, BylaUI::Accent, true), BylaUI::Card), 16.f);
	Add(MakeText(UI(TEXT("ending_other")), 19, BylaUI::TextDim), 32.f);

	UHorizontalBox* Row = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
	if (UHorizontalBoxSlot* S = Row->AddChildToHorizontalBox(bConfirmRestart
		? MakeButton(UI(TEXT("restart_confirm")), ActRestart, NAME_None, BylaUI::Danger, false, 22)
		: MakeButton(UI(TEXT("ending_restart")), ActRestartAsk, NAME_None, BylaUI::ButtonActive, false, 22)))
	{
		S->SetPadding(FMargin(0.f, 0.f, 16.f, 0.f));
	}
	Row->AddChildToHorizontalBox(MakeButton(UI(TEXT("ending_close")), ActClose, NAME_None, BylaUI::Button, false, 22));
	Add(Row, 0.f);
}

void UEndingWidget::HandleAction(FName Action, FName Payload)
{
	if (Action == ActClose)
	{
		if (ADetectivePlayerController* PC = Cast<ADetectivePlayerController>(GetOwningPlayer()))
		{
			PC->ClosePanel();
		}
		return;
	}
	if (Action == ActRestartAsk)
	{
		bConfirmRestart = true;
	}
	else if (Action == ActRestart)
	{
		if (UCaseStateSubsystem* Case = GetCase())
		{
			Case->StartNewCase();
		}
		UGameplayStatics::OpenLevel(this, TEXT("L_Office"));
		return;
	}
	MarkDirty();
}
