#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "BylaPanelWidget.generated.h"

class UButton;
class UCaseStateSubsystem;
class UTextBlock;
class UWidget;
class UBylaPanelWidget;

/** Кнопки UMG не передают параметры в OnClicked, поэтому у каждой кнопки свой маленький посредник. */
UCLASS()
class BYLAVSETI_API UBylaClickProxy : public UObject
{
	GENERATED_BODY()

public:
	TWeakObjectPtr<UBylaPanelWidget> Owner;
	FName Action;
	FName Payload;

	UFUNCTION()
	void HandleClicked();
};

/**
 * База для интерфейсов, собранных в коде (ноутбук, допрос, доска).
 * Даёт конструкторы текста/кнопок/карточек и отложенную перерисовку при изменении дела.
 */
UCLASS(Abstract)
class BYLAVSETI_API UBylaPanelWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	/** Нажатие кнопки, созданной через MakeButton. */
	virtual void HandleAction(FName Action, FName Payload) {}

	/** Перерисовать на следующем кадре. */
	void MarkDirty() { bDirty = true; }

protected:
	virtual TSharedRef<SWidget> RebuildWidget() override;
	virtual void NativeConstruct() override;
	virtual void NativeDestruct() override;
	virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

	/** Создаёт постоянный каркас (вызывается один раз). */
	virtual void BuildLayout() {}
	/** Перестраивает изменяемую часть. */
	virtual void Refresh() {}

	UCaseStateSubsystem* GetCase() const;
	FText UI(const TCHAR* Key) const;

	UTextBlock* MakeText(const FText& Text, int32 Size, const FLinearColor& Color, bool bBold = false, bool bWrap = true);
	/** bPersistent = кнопка каркаса; иначе кнопка удаляется при следующем ResetContentButtons(). */
	UButton* MakeButton(const FText& Label, FName Action, FName Payload, const FLinearColor& Color, bool bPersistent = false, int32 FontSize = 20);
	UWidget* MakeCard(UWidget* Inner, const FLinearColor& Color, float Padding = 16.f);

	/** Вызывать в начале Refresh перед очисткой изменяемой части. */
	void ResetContentButtons();

private:
	bool bDirty = true;

	UPROPERTY(Transient)
	TArray<TObjectPtr<UBylaClickProxy>> PersistentProxies;

	UPROPERTY(Transient)
	TArray<TObjectPtr<UBylaClickProxy>> ContentProxies;

	FDelegateHandle ChangedHandle;
};
