#pragma once

#include "CoreMinimal.h"
#include "UI/BylaPanelWidget.h"
#include "BoardWidget.generated.h"

class UCanvasPanel;
class UCanvasPanelSlot;
class UVerticalBox;
class UBoardWidget;

/** Нить для отрисовки. */
struct FBoardLine
{
	FVector2D From;
	FVector2D To;
	FLinearColor Color;
	float Thickness = 3.f;
};

/** Слой под карточками: рисует нити линиями. */
UCLASS()
class BYLAVSETI_API UBoardLinesWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	TWeakObjectPtr<UBoardWidget> Board;

protected:
	virtual int32 NativePaint(const FPaintArgs& Args, const FGeometry& AllottedGeometry, const FSlateRect& MyCullingRect,
		FSlateWindowElementList& OutDrawElements, int32 LayerId, const FWidgetStyle& InWidgetStyle, bool bParentEnabled) const override;
};

enum class EBoardDrag : uint8
{
	None,
	MoveCard,
	Thread
};

/**
 * Доска «СЛЕД»: карточки улик на пробковой доске.
 * Перетащить карточку — переместить. Тянуть от красной булавки (или правой кнопкой) к другой карточке — нить.
 * Подпись на нити — кнопка удаления.
 */
UCLASS()
class BYLAVSETI_API UBoardWidget : public UBylaPanelWidget
{
	GENERATED_BODY()

public:
	static constexpr float CardW = 220.f;
	static constexpr float CardH = 84.f;

	virtual void HandleAction(FName Action, FName Payload) override;

	/** Данные для слоя нитей. */
	void CollectLines(TArray<FBoardLine>& Out) const;

	static FLinearColor LinkColor(FName Type);

protected:
	virtual void NativeOnInitialized() override;
	virtual void BuildLayout() override;
	virtual void Refresh() override;

	virtual FReply NativeOnMouseButtonDown(const FGeometry& InGeometry, const FPointerEvent& InMouseEvent) override;
	virtual FReply NativeOnMouseMove(const FGeometry& InGeometry, const FPointerEvent& InMouseEvent) override;
	virtual FReply NativeOnMouseButtonUp(const FGeometry& InGeometry, const FPointerEvent& InMouseEvent) override;

private:
	void BuildCards();
	void BuildSidePanel();
	FText EvidenceTitle(FName Id) const;
	FText LinkTypeName(FName Type) const;

	/** Экранные координаты -> координаты доски. Возвращает false, если точка вне доски. */
	bool ToBoard(const FVector2D& ScreenPosition, FVector2D& OutBoard) const;
	FName HitCard(const FVector2D& BoardPosition, bool& bOutOnPin) const;
	FVector2D CardCenter(FName Id) const;
	FVector2D PinCenter(FName Id) const;
	void MoveCardWidgets(FName Id, const FVector2D& Position);

	UPROPERTY(Transient)
	TObjectPtr<UCanvasPanel> Canvas;

	UPROPERTY(Transient)
	TObjectPtr<UBoardLinesWidget> Lines;

	UPROPERTY(Transient)
	TObjectPtr<UVerticalBox> Side;

	UPROPERTY(Transient)
	TMap<FName, TObjectPtr<UCanvasPanelSlot>> CardSlots;

	UPROPERTY(Transient)
	TMap<FName, TObjectPtr<UCanvasPanelSlot>> PinSlots;

	TMap<FName, FVector2D> Positions;
	TArray<FName> CardOrder;

	EBoardDrag DragMode = EBoardDrag::None;
	FName DragCard;
	FVector2D DragOffset = FVector2D::ZeroVector;
	FVector2D DragPoint = FVector2D::ZeroVector;

	FName PendingA;
	FName PendingB;
	FText LastReport;
	bool bLastReportAccepted = false;
};
