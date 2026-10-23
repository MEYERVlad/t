#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "DetectivePlayerController.generated.h"

class UBylaPanelWidget;
class UGameHudWidget;
class UCaseStateSubsystem;

/** Управляет интерфейсом: HUD, ноутбук, всплывающие уведомления. */
UCLASS()
class BYLAVSETI_API ADetectivePlayerController : public APlayerController
{
	GENERATED_BODY()

public:
	void OpenLaptop();
	void OpenInterrogation(FName InterrogationId);
	void OpenEnding(FName EndingId);
	/** Закрывает ноутбук или допрос. */
	void ClosePanel();
	bool IsPanelOpen() const { return ActivePanel != nullptr; }

	void ShowToast(const FText& Message);
	void SetInteractionPrompt(const FText& Prompt);

protected:
	virtual void BeginPlay() override;
	virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

private:
	UCaseStateSubsystem* GetCase() const;
	void OpenPanel(UBylaPanelWidget* Panel);
	void HandleEvidenceAdded(FName Id);
	void HandleFeedPublished(FName Id);
	void HandleCaseChanged();
	void HandleEndingReached(FName EndingId);

	UPROPERTY(Transient)
	TObjectPtr<UGameHudWidget> Hud;

	UPROPERTY(Transient)
	TObjectPtr<UBylaPanelWidget> ActivePanel;

	FDelegateHandle EvidenceHandle;
	FDelegateHandle FeedHandle;
	FDelegateHandle ChangedHandle;
	FDelegateHandle EndingHandle;
};
