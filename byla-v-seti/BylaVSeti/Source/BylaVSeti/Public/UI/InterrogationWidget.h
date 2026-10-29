#pragma once

#include "CoreMinimal.h"
#include "UI/BylaPanelWidget.h"
#include "InterrogationWidget.generated.h"

class UScrollBox;
class UTextBlock;
class UVerticalBox;

/**
 * Допрос: показания по одному, «Предъявить улику» против текущего показания.
 * Верная улика ломает показание и даёт новое, неверная стоит доверия.
 * Посты, пришедшие во время допроса, показываются баннером вместе с реакцией персонажа.
 */
UCLASS()
class BYLAVSETI_API UInterrogationWidget : public UBylaPanelWidget
{
	GENERATED_BODY()

public:
	/** Вызвать до AddToViewport. */
	void SetInterrogation(FName InId) { InterrogationId = InId; }

	virtual void HandleAction(FName Action, FName Payload) override;

protected:
	virtual void NativeOnInitialized() override;
	virtual void NativeConstruct() override;
	virtual void NativeDestruct() override;
	virtual FReply NativeOnKeyDown(const FGeometry& InGeometry, const FKeyEvent& InKeyEvent) override;
	virtual void BuildLayout() override;
	virtual void Refresh() override;

private:
	void HandleFeedPublished(FName FeedId);
	void AddBody(UWidget* Widget, float BottomPadding = 14.f);
	/** Озвучка: проиграть реплику (если есть файл). */
	void PlayVoice(FName VoiceId);
	/** Озвучка: проиграть текущее показание. */
	void PlayCurrentStatement();

	FName InterrogationId;
	int32 Index = 0;
	bool bPresenting = false;
	FText LastReaction;
	bool bLastCorrect = false;
	bool bJustFinished = false;
	FText LiveBanner;
	FText LiveReaction;

	UPROPERTY(Transient)
	TObjectPtr<UTextBlock> TitleText;

	UPROPERTY(Transient)
	TObjectPtr<UTextBlock> TrustText;

	UPROPERTY(Transient)
	TObjectPtr<UScrollBox> BodyScroll;

	UPROPERTY(Transient)
	TObjectPtr<UVerticalBox> Body;

	FDelegateHandle FeedHandle;
};
