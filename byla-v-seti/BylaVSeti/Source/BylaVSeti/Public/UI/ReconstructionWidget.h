#pragma once

#include "CoreMinimal.h"
#include "Case/CaseTypes.h"
#include "UI/BylaPanelWidget.h"
#include "ReconstructionWidget.generated.h"

class UBorder;
class UCanvasPanel;
class UHorizontalBox;
class USlider;
class UTextBlock;
class UVerticalBox;
class UWidget;

/**
 * Реконструкция ночи 14.10.2016 в служебном ПК.
 * Схема местности, ползунок времени 21:00 → 23:45, силуэты двигаются по известным фактам.
 * Что игрок ещё не доказал, показывается версией обвинения. В конце — вопрос, который «защёлкивает» реконструкцию.
 */
UCLASS()
class BYLAVSETI_API UReconstructionWidget : public UBylaPanelWidget
{
	GENERATED_BODY()

public:
	virtual void HandleAction(FName Action, FName Payload) override;

protected:
	virtual void BuildLayout() override;
	virtual void Refresh() override;

private:
	UFUNCTION()
	void HandleSlider(float Value);

	/** Перерисовать то, что зависит от времени: силуэты, часы, текущее событие. */
	void UpdateTime();
	bool IsEventKnown(const FCaseRecoEvent& Event) const;
	static FText TimeText(int32 Minute);

	int32 CurrentMinute = 0;
	FText LastAnswer;
	bool bLastAnswerCorrect = false;

	UPROPERTY(Transient)
	TObjectPtr<UVerticalBox> RootBox;

	UPROPERTY(Transient)
	TObjectPtr<UCanvasPanel> Map;

	/** Рамка схемы и строка с часами — прячутся, пока реконструкция закрыта. */
	UPROPERTY(Transient)
	TObjectPtr<UWidget> MapFrame;

	UPROPERTY(Transient)
	TObjectPtr<UWidget> TimeRowWidget;

	UPROPERTY(Transient)
	TObjectPtr<UTextBlock> ClockText;

	UPROPERTY(Transient)
	TObjectPtr<USlider> Slider;

	UPROPERTY(Transient)
	TObjectPtr<UHorizontalBox> JumpRow;

	UPROPERTY(Transient)
	TObjectPtr<UVerticalBox> EventBox;

	UPROPERTY(Transient)
	TObjectPtr<UVerticalBox> QuestionBox;

	UPROPERTY(Transient)
	TObjectPtr<UTextBlock> LockedText;

	/** Метки силуэтов (по индексу в Actors). */
	UPROPERTY(Transient)
	TArray<TObjectPtr<UBorder>> ActorMarks;

	bool bBuiltMap = false;
};
