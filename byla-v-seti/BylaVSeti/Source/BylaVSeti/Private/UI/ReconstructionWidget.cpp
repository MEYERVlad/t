#include "UI/ReconstructionWidget.h"

#include "Blueprint/WidgetTree.h"
#include "Case/CaseStateSubsystem.h"
#include "Components/Border.h"
#include "Components/Button.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Components/HorizontalBox.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/ScrollBox.h"
#include "Components/SizeBox.h"
#include "Components/Slider.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Components/WrapBox.h"
#include "Components/WrapBoxSlot.h"
#include "UI/UIStyle.h"

namespace
{
	const FName ActJump(TEXT("reco_jump"));
	const FName ActAnswer(TEXT("reco_answer"));
	const FName NoPlace(TEXT("none"));

	constexpr float MapW = 1000.f;
	constexpr float MapH = 380.f;
	constexpr float PlaceW = 190.f;
	constexpr float PlaceH = 40.f;
	constexpr float MarkW = 92.f;
	constexpr float MarkH = 26.f;

	// «Плёнка 2016 года»: холодная сине-зелёная гамма.
	const FLinearColor MapColor(0.020f, 0.045f, 0.055f, 1.f);
	const FLinearColor PlaceColor(0.07f, 0.12f, 0.14f, 1.f);
	const FLinearColor RecColor(0.95f, 0.22f, 0.20f, 1.f);
	const FLinearColor TapeText(0.70f, 0.86f, 0.88f, 1.f);
}

void UReconstructionWidget::BuildLayout()
{
	UScrollBox* Scroll = WidgetTree->ConstructWidget<UScrollBox>(UScrollBox::StaticClass(), TEXT("RecoRoot"));
	WidgetTree->RootWidget = Scroll;
	RootBox = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	Scroll->AddChild(RootBox);

	const UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}
	const FCaseReconstruction& Reco = Case->GetReconstruction();

	auto Add = [this](UWidget* W, float Bottom)
	{
		if (UVerticalBoxSlot* S = RootBox->AddChildToVerticalBox(W))
		{
			S->SetPadding(FMargin(0.f, 0.f, 0.f, Bottom));
		}
	};

	// Заголовок с «записью», как на старой кассете.
	UHorizontalBox* Header = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
	if (UHorizontalBoxSlot* S = Header->AddChildToHorizontalBox(MakeText(Reco.Title, 28, BylaUI::Text, true, false)))
	{
		S->SetVerticalAlignment(VAlign_Center);
		S->SetPadding(FMargin(0.f, 0.f, 24.f, 0.f));
	}
	if (UHorizontalBoxSlot* S = Header->AddChildToHorizontalBox(MakeText(FText::FromString(TEXT("REC  14.10.2016")), 22, RecColor, true, false)))
	{
		S->SetVerticalAlignment(VAlign_Center);
	}
	Add(Header, 8.f);
	Add(MakeText(Reco.Intro, 18, BylaUI::TextDim), 14.f);

	LockedText = MakeText(Reco.LockedText, 21, BylaUI::Warning, true);
	Add(LockedText, 14.f);

	// Схема местности.
	USizeBox* MapSize = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	MapSize->SetWidthOverride(MapW);
	MapSize->SetHeightOverride(MapH);
	UBorder* MapBack = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
	MapBack->SetBrushColor(MapColor);
	MapBack->SetPadding(FMargin(0.f));
	Map = WidgetTree->ConstructWidget<UCanvasPanel>(UCanvasPanel::StaticClass());
	MapBack->SetContent(Map);
	MapSize->AddChild(MapBack);
	MapFrame = MapSize;
	if (UVerticalBoxSlot* S = RootBox->AddChildToVerticalBox(MapSize))
	{
		S->SetPadding(FMargin(0.f, 0.f, 0.f, 12.f));
		S->SetHorizontalAlignment(HAlign_Left);
	}

	for (const FCaseRecoPlace& Place : Reco.Places)
	{
		UBorder* Box = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
		Box->SetBrushColor(PlaceColor);
		Box->SetPadding(FMargin(8.f, 4.f));
		Box->SetHorizontalAlignment(HAlign_Center);
		Box->SetVerticalAlignment(VAlign_Center);
		Box->SetContent(MakeText(Place.Name, 15, TapeText, true, true));
		if (UCanvasPanelSlot* S = Map->AddChildToCanvas(Box))
		{
			S->SetPosition(FVector2D(Place.X * MapW - PlaceW / 2.f, Place.Y * MapH - PlaceH / 2.f));
			S->SetSize(FVector2D(PlaceW, PlaceH));
		}
	}
	for (const FCaseRecoActor& Actor : Reco.Actors)
	{
		UBorder* Mark = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
		Mark->SetBrushColor(FLinearColor(FColor::FromHex(Actor.Color)));
		Mark->SetPadding(FMargin(4.f, 2.f));
		Mark->SetHorizontalAlignment(HAlign_Center);
		Mark->SetVerticalAlignment(VAlign_Center);
		Mark->SetContent(MakeText(Actor.Name, 14, FLinearColor::White, true, false));
		if (UCanvasPanelSlot* S = Map->AddChildToCanvas(Mark))
		{
			S->SetSize(FVector2D(MarkW, MarkH));
		}
		ActorMarks.Add(Mark);
	}

	// Часы и ползунок.
	UHorizontalBox* TimeRow = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
	ClockText = MakeText(FText::GetEmpty(), 34, RecColor, true, false);
	if (UHorizontalBoxSlot* S = TimeRow->AddChildToHorizontalBox(ClockText))
	{
		S->SetVerticalAlignment(VAlign_Center);
		S->SetPadding(FMargin(0.f, 0.f, 20.f, 0.f));
	}
	USizeBox* SliderSize = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	SliderSize->SetWidthOverride(MapW - 140.f);
	Slider = WidgetTree->ConstructWidget<USlider>(USlider::StaticClass());
	Slider->SetMinValue(0.f);
	Slider->SetMaxValue(static_cast<float>(FMath::Max(1, Reco.EndMinute)));
	Slider->SetStepSize(1.f);
	Slider->SetValue(0.f);
	Slider->OnValueChanged.AddDynamic(this, &UReconstructionWidget::HandleSlider);
	SliderSize->AddChild(Slider);
	if (UHorizontalBoxSlot* S = TimeRow->AddChildToHorizontalBox(SliderSize))
	{
		S->SetVerticalAlignment(VAlign_Center);
	}
	Add(TimeRow, 8.f);
	TimeRowWidget = TimeRow;

	JumpRow = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
	Add(JumpRow, 14.f);

	EventBox = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	Add(EventBox, 18.f);

	QuestionBox = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	Add(QuestionBox, 0.f);

	bBuiltMap = true;
	Refresh();
}

FText UReconstructionWidget::TimeText(int32 Minute)
{
	const int32 Total = 21 * 60 + Minute;
	return FText::FromString(FString::Printf(TEXT("%02d:%02d"), (Total / 60) % 24, Total % 60));
}

bool UReconstructionWidget::IsEventKnown(const FCaseRecoEvent& Event) const
{
	const UCaseStateSubsystem* Case = GetCase();
	return Event.Requires.IsNone() || (Case && Case->HasEvidence(Event.Requires));
}

void UReconstructionWidget::HandleSlider(float Value)
{
	CurrentMinute = FMath::RoundToInt(Value);
	UpdateTime();
}

void UReconstructionWidget::Refresh()
{
	if (!bBuiltMap)
	{
		return;
	}
	ResetContentButtons();
	const UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}
	const FCaseReconstruction& Reco = Case->GetReconstruction();
	const bool bUnlocked = Case->IsReconstructionUnlocked();
	const ESlateVisibility Shown = bUnlocked ? ESlateVisibility::Visible : ESlateVisibility::Collapsed;
	LockedText->SetVisibility(bUnlocked ? ESlateVisibility::Collapsed : ESlateVisibility::Visible);
	MapFrame->SetVisibility(Shown);
	TimeRowWidget->SetVisibility(Shown);
	JumpRow->SetVisibility(Shown);
	EventBox->SetVisibility(Shown);
	QuestionBox->SetVisibility(Shown);
	if (!bUnlocked)
	{
		return;
	}

	// Быстрый переход к событиям. Неизвестные пока события — тусклые.
	JumpRow->ClearChildren();
	for (const FCaseRecoEvent& Event : Reco.Events)
	{
		const FLinearColor Color = IsEventKnown(Event) ? BylaUI::Button : FLinearColor(0.09f, 0.10f, 0.12f, 1.f);
		if (UHorizontalBoxSlot* S = JumpRow->AddChildToHorizontalBox(
			MakeButton(TimeText(Event.Minute), ActJump, FName(*FString::FromInt(Event.Minute)), Color, false, 16)))
		{
			S->SetPadding(FMargin(0.f, 0.f, 6.f, 0.f));
		}
	}

	// Вопрос, который «защёлкивает» реконструкцию.
	QuestionBox->ClearChildren();
	const FCaseRecoQuestion& Q = Reco.Question;
	auto AddQ = [this](UWidget* W, float Bottom)
	{
		if (UVerticalBoxSlot* S = QuestionBox->AddChildToVerticalBox(W))
		{
			S->SetPadding(FMargin(0.f, 0.f, 0.f, Bottom));
		}
	};
	if (Case->IsReconstructionSolved())
	{
		AddQ(MakeCard(MakeText(Q.SolvedText, 21, BylaUI::Good, true), BylaUI::Card), 0.f);
	}
	else if (Case->CanAnswerReconstruction())
	{
		AddQ(MakeText(Q.Text, 24, BylaUI::Accent, true), 10.f);
		UWrapBox* Options = WidgetTree->ConstructWidget<UWrapBox>(UWrapBox::StaticClass());
		for (int32 i = 0; i < Q.Options.Num(); ++i)
		{
			if (UWrapBoxSlot* S = Options->AddChildToWrapBox(MakeButton(Q.Options[i].Text, ActAnswer, FName(*FString::FromInt(i)), BylaUI::Button, false, 18)))
			{
				S->SetPadding(FMargin(0.f, 0.f, 8.f, 8.f));
			}
		}
		AddQ(Options, 8.f);
		if (!LastAnswer.IsEmpty() && !bLastAnswerCorrect)
		{
			AddQ(MakeCard(MakeText(LastAnswer, 20, BylaUI::Warning, true), BylaUI::Card), 0.f);
		}
	}
	else
	{
		AddQ(MakeText(Q.LockedText, 19, BylaUI::TextDim), 0.f);
	}

	UpdateTime();
}

void UReconstructionWidget::UpdateTime()
{
	const UCaseStateSubsystem* Case = GetCase();
	if (!Case || !bBuiltMap)
	{
		return;
	}
	const FCaseReconstruction& Reco = Case->GetReconstruction();
	ClockText->SetText(TimeText(CurrentMinute));

	// Где кто стоит на эту минуту: последнее событие до неё, где о силуэте что-то известно.
	TArray<FName> Where;
	Where.Init(NAME_None, Reco.Actors.Num());
	const FCaseRecoEvent* Current = nullptr;
	for (const FCaseRecoEvent& Event : Reco.Events)
	{
		if (Event.Minute > CurrentMinute)
		{
			continue;
		}
		if (!Current || Event.Minute >= Current->Minute)
		{
			Current = &Event;
		}
		const TMap<FName, FName>& Positions = IsEventKnown(Event) ? Event.Positions : Event.PositionsUnknown;
		for (int32 i = 0; i < Reco.Actors.Num(); ++i)
		{
			if (const FName* Place = Positions.Find(Reco.Actors[i].Id))
			{
				Where[i] = *Place;
			}
		}
	}

	// Расставляем метки: под названием места, по две в ряд.
	TMap<FName, int32> Crowd;
	for (int32 i = 0; i < Reco.Actors.Num() && i < ActorMarks.Num(); ++i)
	{
		UBorder* Mark = ActorMarks[i];
		const FCaseRecoActor& Actor = Reco.Actors[i];
		const FCaseRecoPlace* Place = Reco.Places.FindByPredicate([&](const FCaseRecoPlace& P) { return P.Id == Where[i]; });
		const bool bKnownActor = Actor.RequiresEvidence.IsNone() || Case->HasEvidence(Actor.RequiresEvidence);
		if (!Place || Where[i] == NoPlace || !bKnownActor)
		{
			Mark->SetVisibility(ESlateVisibility::Collapsed);
			continue;
		}
		Mark->SetVisibility(ESlateVisibility::HitTestInvisible);
		const int32 K = Crowd.FindOrAdd(Place->Id)++;
		const FVector2D Pos(Place->X * MapW - MarkW - 2.f + (K % 2) * (MarkW + 4.f),
			Place->Y * MapH + PlaceH / 2.f + 4.f + (K / 2) * (MarkH + 4.f));
		if (UCanvasPanelSlot* S = Cast<UCanvasPanelSlot>(Mark->Slot))
		{
			S->SetPosition(Pos);
		}
	}

	// Текущее событие.
	EventBox->ClearChildren();
	if (Current)
	{
		const bool bKnown = IsEventKnown(*Current);
		UVerticalBox* Box = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		Box->AddChildToVerticalBox(MakeText(FText::Format(FText::FromString(TEXT("{0}  {1}")), TimeText(Current->Minute), Current->Title),
			22, bKnown ? BylaUI::Text : BylaUI::TextDim, true));
		if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeText(bKnown ? Current->Text : Current->TextUnknown, 20,
			bKnown ? BylaUI::Text : BylaUI::Warning)))
		{
			S->SetPadding(FMargin(0.f, 8.f, 0.f, 0.f));
		}
		EventBox->AddChildToVerticalBox(MakeCard(Box, BylaUI::Card, 18.f));
	}
}

void UReconstructionWidget::HandleAction(FName Action, FName Payload)
{
	if (Action == ActJump)
	{
		CurrentMinute = FCString::Atoi(*Payload.ToString());
		if (Slider)
		{
			Slider->SetValue(static_cast<float>(CurrentMinute));
		}
		UpdateTime();
		return;
	}
	if (Action == ActAnswer)
	{
		if (UCaseStateSubsystem* Case = GetCase())
		{
			const FCaseReportResult Result = Case->AnswerReconstruction(FCString::Atoi(*Payload.ToString()));
			LastAnswer = Result.Message;
			bLastAnswerCorrect = Result.bAccepted;
		}
		MarkDirty();
	}
}
