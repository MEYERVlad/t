#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "GameHudWidget.generated.h"

class UTextBlock;
class UVerticalBox;

/** HUD: точка прицела, подсказка взаимодействия, уведомления, доверие начальства. Собирается в коде. */
UCLASS()
class BYLAVSETI_API UGameHudWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	void SetPrompt(const FText& Prompt);
	void AddToast(const FText& Message);
	void SetTrust(int32 Value, const FText& Label);

protected:
	virtual TSharedRef<SWidget> RebuildWidget() override;
	virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

private:
	void BuildLayout();
	void RebuildToasts();

	struct FToast
	{
		FText Text;
		double ExpireTime = 0.0;
	};
	TArray<FToast> Toasts;

	UPROPERTY(Transient)
	TObjectPtr<UTextBlock> PromptText;

	UPROPERTY(Transient)
	TObjectPtr<UTextBlock> TrustText;

	UPROPERTY(Transient)
	TObjectPtr<UVerticalBox> ToastBox;

	FText CurrentPrompt;

	static constexpr double ToastSeconds = 8.0;
	static constexpr int32 MaxToasts = 4;
};
