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
	/** Выбор в главном меню: продолжить сохранённое дело или начать новое. Закрывает меню. */
	void BeginCase(bool bContinue);
	/** Закрывает ноутбук или допрос. */
	void ClosePanel();

	/** Консоль (клавиша ~): показать всех скрытых по сюжету персонажей и предметы. Повторный вызов — вернуть как было. */
	UFUNCTION(Exec)
	void BylaShowAll();

	/** Консоль (клавиша ~): поставить сюжетный флаг, например BylaFlag kira_identified. Пишется в сохранение. */
	UFUNCTION(Exec)
	void BylaFlag(FName Flag);

	/** Консоль (клавиша ~): выдать улику, например BylaEvidence bank_statement. Пишется в сохранение. */
	UFUNCTION(Exec)
	void BylaEvidence(FName EvidenceId);
	bool IsPanelOpen() const { return ActivePanel != nullptr; }
	/** Выход из игры (кнопка в меню и в компьютере). */
	void ExitGame();

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
	/** Раз в 20 секунд: если игрок давно не продвигался — напомнить про подсказку. */
	void CheckStuck();

	UPROPERTY(Transient)
	TObjectPtr<UGameHudWidget> Hud;

	UPROPERTY(Transient)
	TObjectPtr<UBylaPanelWidget> ActivePanel;

	FDelegateHandle EvidenceHandle;
	FDelegateHandle FeedHandle;
	FDelegateHandle ChangedHandle;
	FDelegateHandle EndingHandle;
	FTimerHandle StuckTimer;
	FName LastNudgedHint;
	/** Сейчас играет музыка допроса — при закрытии вернуть музыку локации. */
	bool bSpecialMusic = false;
};
