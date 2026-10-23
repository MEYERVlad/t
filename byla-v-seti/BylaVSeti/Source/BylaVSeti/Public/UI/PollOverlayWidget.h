#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "PollOverlayWidget.generated.h"

class UBorder;
class UVerticalBox;

/**
 * Плашка голосования чата поверх всего экрана (видна зрителям стрима, даже если ноутбук закрыт).
 * Во время голосования: вопрос, варианты с номерами, полоски голосов, таймер.
 * После — итог на несколько секунд.
 */
UCLASS()
class BYLAVSETI_API UPollOverlayWidget : public UUserWidget
{
	GENERATED_BODY()

protected:
	virtual TSharedRef<SWidget> RebuildWidget() override;
	virtual void NativeConstruct() override;
	virtual void NativeDestruct() override;
	virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

private:
	void BuildLayout();
	void Rebuild();
	void HandleTwitchChanged();
	FText UI(const TCHAR* Key) const;

	UPROPERTY(Transient)
	TObjectPtr<UBorder> Panel;

	UPROPERTY(Transient)
	TObjectPtr<UVerticalBox> Rows;

	FName ShownResultPoll;
	double ResultHideTime = 0.0;
	bool bDirty = true;
	FDelegateHandle TwitchHandle;

	static constexpr double ResultSeconds = 12.0;
};
