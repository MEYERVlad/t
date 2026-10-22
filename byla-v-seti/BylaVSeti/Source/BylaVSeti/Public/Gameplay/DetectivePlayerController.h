#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "DetectivePlayerController.generated.h"

class UGameHudWidget;
class ULaptopWidget;
class UCaseStateSubsystem;

/** Управляет интерфейсом: HUD, ноутбук, всплывающие уведомления. */
UCLASS()
class BYLAVSETI_API ADetectivePlayerController : public APlayerController
{
	GENERATED_BODY()

public:
	void OpenLaptop();
	void CloseLaptop();
	bool IsLaptopOpen() const { return Laptop != nullptr; }

	void ShowToast(const FText& Message);
	void SetInteractionPrompt(const FText& Prompt);

protected:
	virtual void BeginPlay() override;
	virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

private:
	UCaseStateSubsystem* GetCase() const;
	void HandleEvidenceAdded(FName Id);
	void HandleFeedPublished(FName Id);
	void HandleCaseChanged();

	UPROPERTY(Transient)
	TObjectPtr<UGameHudWidget> Hud;

	UPROPERTY(Transient)
	TObjectPtr<ULaptopWidget> Laptop;

	FDelegateHandle EvidenceHandle;
	FDelegateHandle FeedHandle;
	FDelegateHandle ChangedHandle;
};
