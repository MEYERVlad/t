#pragma once

#include "CoreMinimal.h"
#include "UI/BylaPanelWidget.h"
#include "EndingWidget.generated.h"

class UVerticalBox;

/** Финальный экран: название концовки, итог дела, статистика, «Начать заново». */
UCLASS()
class BYLAVSETI_API UEndingWidget : public UBylaPanelWidget
{
	GENERATED_BODY()

public:
	/** Вызвать до AddToViewport. */
	void SetEnding(FName InEndingId) { EndingId = InEndingId; }

	virtual void HandleAction(FName Action, FName Payload) override;

protected:
	virtual void NativeOnInitialized() override;
	virtual FReply NativeOnKeyDown(const FGeometry& InGeometry, const FKeyEvent& InKeyEvent) override;
	virtual void BuildLayout() override;
	virtual void Refresh() override;

private:
	FName EndingId;
	bool bConfirmRestart = false;

	UPROPERTY(Transient)
	TObjectPtr<UVerticalBox> Body;
};
