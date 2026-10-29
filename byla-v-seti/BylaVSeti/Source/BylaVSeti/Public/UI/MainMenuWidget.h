#pragma once

#include "CoreMinimal.h"
#include "UI/BylaPanelWidget.h"
#include "MainMenuWidget.generated.h"

class UVerticalBox;

/**
 * Главное меню при запуске игры: «Продолжить дело», «Новое дело», «Настройки», «Выход».
 * Показывается поверх кабинета (он виден сквозь затемнение), Esc меню не закрывает.
 */
UCLASS()
class BYLAVSETI_API UMainMenuWidget : public UBylaPanelWidget
{
	GENERATED_BODY()

public:
	virtual void HandleAction(FName Action, FName Payload) override;

protected:
	virtual void NativeOnInitialized() override;
	virtual FReply NativeOnKeyDown(const FGeometry& InGeometry, const FKeyEvent& InKeyEvent) override;
	virtual void BuildLayout() override;
	virtual void Refresh() override;

private:
	void AddRow(UWidget* Widget, float BottomPadding);
	void BuildMain(bool bHasSave);
	void BuildSettings();

	bool bSettings = false;
	bool bConfirmNew = false;

	UPROPERTY(Transient)
	TObjectPtr<UVerticalBox> Body;
};
