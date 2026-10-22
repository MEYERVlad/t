#include "UI/BoardWidget.h"

#include "Blueprint/WidgetTree.h"
#include "Case/CaseStateSubsystem.h"
#include "Components/Border.h"
#include "Components/Button.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Components/HorizontalBox.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/Overlay.h"
#include "Components/OverlaySlot.h"
#include "Components/ScrollBox.h"
#include "Components/SizeBox.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Components/WrapBox.h"
#include "Components/WrapBoxSlot.h"
#include "Rendering/DrawElements.h"
#include "UI/UIStyle.h"

namespace
{
	const FName ActLink(TEXT("link"));
	const FName ActCancel(TEXT("cancel_link"));
	const FName ActUnlink(TEXT("unlink"));
	const FName ActReport(TEXT("report"));

	const TCHAR* LinkTypes[] = { TEXT("points_to"), TEXT("contradicts"), TEXT("alibi"), TEXT("wrote"), TEXT("was_at"), TEXT("owns") };

	const FLinearColor BoardColor(0.115f, 0.095f, 0.075f, 1.f);
	const FLinearColor PaperColor(0.86f, 0.84f, 0.78f, 1.f);
	const FLinearColor PaperSelected(1.00f, 0.88f, 0.55f, 1.f);
	const FLinearColor InkColor(0.08f, 0.08f, 0.09f, 1.f);
	const FLinearColor PinColor(0.80f, 0.10f, 0.08f, 1.f);

	constexpr float PinSize = 20.f;
	constexpr float PinHitSize = 30.f;
}

// ================================================================ Слой нитей

int32 UBoardLinesWidget::NativePaint(const FPaintArgs& Args, const FGeometry& AllottedGeometry, const FSlateRect& MyCullingRect,
	FSlateWindowElementList& OutDrawElements, int32 LayerId, const FWidgetStyle& InWidgetStyle, bool bParentEnabled) const
{
	const int32 MaxLayer = Super::NativePaint(Args, AllottedGeometry, MyCullingRect, OutDrawElements, LayerId, InWidgetStyle, bParentEnabled);

	const UBoardWidget* BoardWidget = Board.Get();
	if (!BoardWidget)
	{
		return MaxLayer;
	}

	TArray<FBoardLine> BoardLines;
	BoardWidget->CollectLines(BoardLines);

	const int32 Layer = MaxLayer + 1;
	for (const FBoardLine& Line : BoardLines)
	{
		TArray<FVector2f> Points;
		Points.Add(FVector2f(static_cast<float>(Line.From.X), static_cast<float>(Line.From.Y)));
		Points.Add(FVector2f(static_cast<float>(Line.To.X), static_cast<float>(Line.To.Y)));
		FSlateDrawElement::MakeLines(OutDrawElements, Layer, AllottedGeometry.ToPaintGeometry(), Points,
			ESlateDrawEffect::None, Line.Color, true, Line.Thickness);
	}
	return Layer;
}

// ================================================================ Доска

FLinearColor UBoardWidget::LinkColor(FName Type)
{
	if (Type == TEXT("points_to"))   return FLinearColor(0.30f, 0.60f, 1.00f, 1.f);
	if (Type == TEXT("contradicts")) return FLinearColor(1.00f, 0.25f, 0.20f, 1.f);
	if (Type == TEXT("alibi"))       return FLinearColor(0.35f, 0.90f, 0.45f, 1.f);
	if (Type == TEXT("wrote"))       return FLinearColor(1.00f, 0.85f, 0.25f, 1.f);
	if (Type == TEXT("was_at"))      return FLinearColor(0.75f, 0.45f, 1.00f, 1.f);
	if (Type == TEXT("owns"))        return FLinearColor(1.00f, 0.55f, 0.20f, 1.f);
	return FLinearColor::White;
}

void UBoardWidget::NativeOnInitialized()
{
	Super::NativeOnInitialized();
	SetVisibility(ESlateVisibility::Visible);
}

FText UBoardWidget::EvidenceTitle(FName Id) const
{
	const UCaseStateSubsystem* Case = GetCase();
	const FCaseEvidence* E = Case ? Case->FindEvidence(Id) : nullptr;
	return E ? E->Title : FText::FromName(Id);
}

FText UBoardWidget::LinkTypeName(FName Type) const
{
	return UI(*FString::Printf(TEXT("link_%s"), *Type.ToString()));
}

void UBoardWidget::BuildLayout()
{
	UHorizontalBox* Root = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass(), TEXT("BoardRoot"));
	WidgetTree->RootWidget = Root;

	// Пробковая доска: снизу нити, сверху карточки.
	UBorder* BoardBg = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
	BoardBg->SetBrushColor(BoardColor);
	BoardBg->SetPadding(FMargin(0.f));
	BoardBg->SetClipping(EWidgetClipping::ClipToBounds);

	UOverlay* Layers = WidgetTree->ConstructWidget<UOverlay>(UOverlay::StaticClass());
	BoardBg->SetContent(Layers);

	Lines = WidgetTree->ConstructWidget<UBoardLinesWidget>(UBoardLinesWidget::StaticClass());
	Lines->Board = this;
	Lines->SetVisibility(ESlateVisibility::HitTestInvisible);
	if (UOverlaySlot* S = Layers->AddChildToOverlay(Lines))
	{
		S->SetHorizontalAlignment(HAlign_Fill);
		S->SetVerticalAlignment(VAlign_Fill);
	}

	Canvas = WidgetTree->ConstructWidget<UCanvasPanel>(UCanvasPanel::StaticClass());
	if (UOverlaySlot* S = Layers->AddChildToOverlay(Canvas))
	{
		S->SetHorizontalAlignment(HAlign_Fill);
		S->SetVerticalAlignment(VAlign_Fill);
	}

	if (UHorizontalBoxSlot* S = Root->AddChildToHorizontalBox(BoardBg))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}

	// Боковая панель: выбор типа нити, доклад, принятые версии.
	USizeBox* SideSize = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	SideSize->SetWidthOverride(400.f);
	UScrollBox* SideScroll = WidgetTree->ConstructWidget<UScrollBox>(UScrollBox::StaticClass());
	Side = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	SideScroll->AddChild(Side);
	SideSize->AddChild(SideScroll);
	if (UHorizontalBoxSlot* S = Root->AddChildToHorizontalBox(SideSize))
	{
		S->SetPadding(FMargin(18.f, 0.f, 0.f, 0.f));
	}

	Refresh();
}

void UBoardWidget::Refresh()
{
	if (!Canvas || !Side)
	{
		return;
	}
	ResetContentButtons();
	BuildCards();
	BuildSidePanel();
}

void UBoardWidget::BuildCards()
{
	Canvas->ClearChildren();
	CardSlots.Reset();
	PinSlots.Reset();
	Positions.Reset();
	CardOrder.Reset();

	const UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}

	for (const FName& Id : Case->GetKnownEvidence())
	{
		const FCaseEvidence* E = Case->FindEvidence(Id);
		if (!E)
		{
			continue;
		}
		const FVector2D Pos = Case->GetCardPosition(Id);
		Positions.Add(Id, Pos);
		CardOrder.Add(Id);

		const bool bSelected = (Id == PendingA || Id == PendingB);

		UVerticalBox* Box = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		Box->AddChildToVerticalBox(MakeText(UI(*FString::Printf(TEXT("kind_%s"), *E->Kind.ToString())), 12, FLinearColor(0.45f, 0.10f, 0.08f, 1.f), true, false));
		if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeText(E->Title, 15, InkColor, true, true)))
		{
			S->SetPadding(FMargin(0.f, 3.f, 0.f, 0.f));
		}

		UBorder* Card = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
		Card->SetBrushColor(bSelected ? PaperSelected : PaperColor);
		Card->SetPadding(FMargin(10.f, 8.f));
		Card->SetClipping(EWidgetClipping::ClipToBounds);
		Card->SetContent(Box);

		if (UCanvasPanelSlot* S = Canvas->AddChildToCanvas(Card))
		{
			S->SetAutoSize(false);
			S->SetSize(FVector2D(CardW, CardH));
			S->SetPosition(Pos);
			CardSlots.Add(Id, S);
		}

		UBorder* Pin = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
		Pin->SetBrushColor(PinColor);
		if (UCanvasPanelSlot* S = Canvas->AddChildToCanvas(Pin))
		{
			S->SetAutoSize(false);
			S->SetSize(FVector2D(PinSize, PinSize));
			S->SetPosition(PinCenter(Id) - FVector2D(PinSize * 0.5f));
			PinSlots.Add(Id, S);
		}
	}

	// Подписи нитей посередине. Нажатие удаляет нить.
	const TArray<FCaseLink>& Links = Case->GetLinks();
	for (int32 i = 0; i < Links.Num(); ++i)
	{
		const FCaseLink& L = Links[i];
		if (!Positions.Contains(L.A) || !Positions.Contains(L.B))
		{
			continue;
		}
		const FVector2D Mid = (CardCenter(L.A) + CardCenter(L.B)) * 0.5f;
		const FText Label = FText::Format(FText::FromString(TEXT("{0}   x")), LinkTypeName(L.Type));
		UButton* Button = MakeButton(Label, ActUnlink, FName(*FString::FromInt(i)), LinkColor(L.Type) * 0.55f, false, 14);
		if (UCanvasPanelSlot* S = Canvas->AddChildToCanvas(Button))
		{
			S->SetAutoSize(true);
			S->SetAlignment(FVector2D(0.5f, 0.5f));
			S->SetPosition(Mid);
		}
	}
}

void UBoardWidget::BuildSidePanel()
{
	Side->ClearChildren();
	const UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}

	auto Add = [this](UWidget* W, float Bottom)
	{
		if (UVerticalBoxSlot* S = Side->AddChildToVerticalBox(W))
		{
			S->SetPadding(FMargin(0.f, 0.f, 0.f, Bottom));
		}
	};

	Add(MakeText(UI(TEXT("board_header")), 24, BylaUI::Text, true), 6.f);
	Add(MakeText(UI(TEXT("board_help")), 16, BylaUI::TextDim), 14.f);

	// Новая нить: выбор типа.
	if (!PendingA.IsNone() && !PendingB.IsNone())
	{
		UVerticalBox* Box = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		Box->AddChildToVerticalBox(MakeText(FText::Format(UI(TEXT("board_pending")), EvidenceTitle(PendingA), EvidenceTitle(PendingB)), 17, BylaUI::Warning, true));
		UWrapBox* Types = WidgetTree->ConstructWidget<UWrapBox>(UWrapBox::StaticClass());
		for (const TCHAR* Type : LinkTypes)
		{
			if (UWrapBoxSlot* S = Types->AddChildToWrapBox(MakeButton(LinkTypeName(Type), ActLink, FName(Type), LinkColor(Type) * 0.5f, false, 17)))
			{
				S->SetPadding(FMargin(0.f, 8.f, 8.f, 0.f));
			}
		}
		if (UWrapBoxSlot* S = Types->AddChildToWrapBox(MakeButton(UI(TEXT("board_cancel")), ActCancel, NAME_None, BylaUI::Danger, false, 17)))
		{
			S->SetPadding(FMargin(0.f, 8.f, 8.f, 0.f));
		}
		Box->AddChildToVerticalBox(Types);
		Add(MakeCard(Box, BylaUI::Card), 14.f);
	}

	// Легенда цветов.
	Add(MakeText(UI(TEXT("board_legend")), 17, BylaUI::Accent, true), 4.f);
	for (const TCHAR* Type : LinkTypes)
	{
		Add(MakeText(FText::Format(FText::FromString(TEXT("====  {0}")), LinkTypeName(Type)), 16, LinkColor(Type), true, false), 2.f);
	}

	// Доклад.
	Add(MakeButton(UI(TEXT("report")), ActReport, NAME_None, BylaUI::ButtonActive), 10.f);
	if (!LastReport.IsEmpty())
	{
		Add(MakeCard(MakeText(LastReport, 17, bLastReportAccepted ? BylaUI::Good : BylaUI::Warning, true), BylaUI::Card, 12.f), 12.f);
	}

	const TArray<const FCaseHypothesis*> Confirmed = Case->GetConfirmedHypotheses();
	if (Confirmed.Num() > 0)
	{
		Add(MakeText(UI(TEXT("board_confirmed")), 17, BylaUI::Accent, true), 6.f);
		for (const FCaseHypothesis* H : Confirmed)
		{
			Add(MakeCard(MakeText(H->Title, 16, BylaUI::Text), BylaUI::Card, 10.f), 6.f);
		}
	}
}

// ================================================================ Геометрия

FVector2D UBoardWidget::CardCenter(FName Id) const
{
	const FVector2D* Pos = Positions.Find(Id);
	return Pos ? *Pos + FVector2D(CardW * 0.5f, CardH * 0.5f) : FVector2D::ZeroVector;
}

FVector2D UBoardWidget::PinCenter(FName Id) const
{
	const FVector2D* Pos = Positions.Find(Id);
	return Pos ? *Pos + FVector2D(CardW - 14.f, 4.f) : FVector2D::ZeroVector;
}

bool UBoardWidget::ToBoard(const FVector2D& ScreenPosition, FVector2D& OutBoard) const
{
	if (!Canvas)
	{
		return false;
	}
	const FGeometry& Geometry = Canvas->GetCachedGeometry();
	OutBoard = Geometry.AbsoluteToLocal(ScreenPosition);
	const FVector2D Size = Geometry.GetLocalSize();
	return OutBoard.X >= 0.f && OutBoard.Y >= 0.f && OutBoard.X <= Size.X && OutBoard.Y <= Size.Y;
}

FName UBoardWidget::HitCard(const FVector2D& P, bool& bOutOnPin) const
{
	bOutOnPin = false;
	// С конца: верхние карточки рисуются последними.
	for (int32 i = CardOrder.Num() - 1; i >= 0; --i)
	{
		const FName Id = CardOrder[i];
		const FVector2D Pin = PinCenter(Id);
		if (FMath::Abs(P.X - Pin.X) <= PinHitSize * 0.5f && FMath::Abs(P.Y - Pin.Y) <= PinHitSize * 0.5f)
		{
			bOutOnPin = true;
			return Id;
		}
		const FVector2D Pos = Positions.FindRef(Id);
		if (P.X >= Pos.X && P.Y >= Pos.Y && P.X <= Pos.X + CardW && P.Y <= Pos.Y + CardH)
		{
			return Id;
		}
	}
	return NAME_None;
}

void UBoardWidget::MoveCardWidgets(FName Id, const FVector2D& Position)
{
	Positions.Add(Id, Position);
	if (TObjectPtr<UCanvasPanelSlot>* S = CardSlots.Find(Id))
	{
		(*S)->SetPosition(Position);
	}
	if (TObjectPtr<UCanvasPanelSlot>* S = PinSlots.Find(Id))
	{
		(*S)->SetPosition(PinCenter(Id) - FVector2D(PinSize * 0.5f));
	}
}

void UBoardWidget::CollectLines(TArray<FBoardLine>& Out) const
{
	if (const UCaseStateSubsystem* Case = GetCase())
	{
		for (const FCaseLink& L : Case->GetLinks())
		{
			if (Positions.Contains(L.A) && Positions.Contains(L.B))
			{
				FBoardLine Line;
				Line.From = CardCenter(L.A);
				Line.To = CardCenter(L.B);
				Line.Color = LinkColor(L.Type);
				Line.Thickness = 4.f;
				Out.Add(Line);
			}
		}
	}
	if (!PendingA.IsNone() && !PendingB.IsNone())
	{
		FBoardLine Line;
		Line.From = CardCenter(PendingA);
		Line.To = CardCenter(PendingB);
		Line.Color = FLinearColor(1.f, 1.f, 1.f, 0.6f);
		Line.Thickness = 2.f;
		Out.Add(Line);
	}
	if (DragMode == EBoardDrag::Thread)
	{
		FBoardLine Line;
		Line.From = PinCenter(DragCard);
		Line.To = DragPoint;
		Line.Color = PinColor;
		Line.Thickness = 4.f;
		Out.Add(Line);
	}
}

// ================================================================ Мышь

FReply UBoardWidget::NativeOnMouseButtonDown(const FGeometry& InGeometry, const FPointerEvent& InMouseEvent)
{
	FVector2D P;
	if (!ToBoard(InMouseEvent.GetScreenSpacePosition(), P))
	{
		return Super::NativeOnMouseButtonDown(InGeometry, InMouseEvent);
	}

	bool bOnPin = false;
	const FName Hit = HitCard(P, bOnPin);
	if (Hit.IsNone())
	{
		return Super::NativeOnMouseButtonDown(InGeometry, InMouseEvent);
	}

	const bool bRight = InMouseEvent.GetEffectingButton() == EKeys::RightMouseButton;
	DragCard = Hit;
	DragPoint = P;
	if (bOnPin || bRight)
	{
		DragMode = EBoardDrag::Thread;
	}
	else
	{
		DragMode = EBoardDrag::MoveCard;
		DragOffset = P - Positions.FindRef(Hit);
	}
	return FReply::Handled().CaptureMouse(TakeWidget());
}

FReply UBoardWidget::NativeOnMouseMove(const FGeometry& InGeometry, const FPointerEvent& InMouseEvent)
{
	if (DragMode == EBoardDrag::None)
	{
		return Super::NativeOnMouseMove(InGeometry, InMouseEvent);
	}

	FVector2D P;
	ToBoard(InMouseEvent.GetScreenSpacePosition(), P);
	DragPoint = P;

	if (DragMode == EBoardDrag::MoveCard)
	{
		const FVector2D Size = Canvas->GetCachedGeometry().GetLocalSize();
		FVector2D NewPos = P - DragOffset;
		NewPos.X = FMath::Clamp(NewPos.X, 0.f, FMath::Max(0.f, Size.X - CardW));
		NewPos.Y = FMath::Clamp(NewPos.Y, 0.f, FMath::Max(0.f, Size.Y - CardH));
		MoveCardWidgets(DragCard, NewPos);
	}
	return FReply::Handled();
}

FReply UBoardWidget::NativeOnMouseButtonUp(const FGeometry& InGeometry, const FPointerEvent& InMouseEvent)
{
	if (DragMode == EBoardDrag::None)
	{
		return Super::NativeOnMouseButtonUp(InGeometry, InMouseEvent);
	}

	FVector2D P;
	ToBoard(InMouseEvent.GetScreenSpacePosition(), P);

	if (DragMode == EBoardDrag::MoveCard)
	{
		if (UCaseStateSubsystem* Case = GetCase())
		{
			Case->SetCardPosition(DragCard, Positions.FindRef(DragCard));
		}
	}
	else if (DragMode == EBoardDrag::Thread)
	{
		bool bOnPin = false;
		const FName Target = HitCard(P, bOnPin);
		if (!Target.IsNone() && Target != DragCard)
		{
			PendingA = DragCard;
			PendingB = Target;
			LastReport = FText::GetEmpty();
		}
	}

	DragMode = EBoardDrag::None;
	DragCard = NAME_None;
	MarkDirty();
	return FReply::Handled().ReleaseMouseCapture();
}

// ================================================================ Кнопки

void UBoardWidget::HandleAction(FName Action, FName Payload)
{
	UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}

	if (Action == ActLink)
	{
		Case->AddLink(PendingA, PendingB, Payload);
		PendingA = NAME_None;
		PendingB = NAME_None;
	}
	else if (Action == ActCancel)
	{
		PendingA = NAME_None;
		PendingB = NAME_None;
	}
	else if (Action == ActUnlink)
	{
		Case->RemoveLink(FCString::Atoi(*Payload.ToString()));
		LastReport = FText::GetEmpty();
	}
	else if (Action == ActReport)
	{
		const FCaseReportResult Result = Case->ReportHypothesis();
		LastReport = Result.Message;
		bLastReportAccepted = Result.bAccepted;
	}
	MarkDirty();
}
