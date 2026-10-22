#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "LaptopWidget.generated.h"

class UButton;
class UCaseStateSubsystem;
class UScrollBox;
class UTextBlock;
class UVerticalBox;
class UWidget;
class ULaptopWidget;

/** Кнопки UMG не передают параметры в OnClicked, поэтому у каждой кнопки свой маленький посредник. */
UCLASS()
class BYLAVSETI_API ULaptopClickProxy : public UObject
{
	GENERATED_BODY()

public:
	TWeakObjectPtr<ULaptopWidget> Owner;
	FName Action;
	FName Payload;

	UFUNCTION()
	void HandleClicked();
};

enum class ELaptopApp : uint8
{
	Case,
	Krug,
	Mail,
	Board,
	Decisions
};

/**
 * Служебный ноутбук: «Материалы дела», «Круг», «Почта», доска «СЛЕД», «Решения».
 * Весь интерфейс собирается в коде, Widget Blueprint не нужен.
 */
UCLASS()
class BYLAVSETI_API ULaptopWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	void HandleAction(FName Action, FName Payload);

protected:
	virtual void NativeOnInitialized() override;
	virtual TSharedRef<SWidget> RebuildWidget() override;
	virtual void NativeConstruct() override;
	virtual void NativeDestruct() override;
	virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;
	virtual FReply NativeOnKeyDown(const FGeometry& InGeometry, const FKeyEvent& InKeyEvent) override;

private:
	UCaseStateSubsystem* GetCase() const;
	FText UI(const TCHAR* Key) const;

	void BuildLayout();
	void BuildNav();
	void Refresh();
	void BuildCaseApp();
	void BuildFeedApp(FName Channel);
	void BuildBoardApp();
	void BuildDecisionsApp();

	UTextBlock* MakeText(const FText& Text, int32 Size, const FLinearColor& Color, bool bBold = false, bool bWrap = true);
	UButton* MakeButton(const FText& Label, FName Action, FName Payload, const FLinearColor& Color, bool bPersistent = false);
	UWidget* MakeCard(UWidget* Inner, const FLinearColor& Color);
	void AddContent(UWidget* Widget, float BottomPadding = 12.f);
	FText EvidenceTitle(FName Id) const;
	FText LinkTypeName(FName Type) const;

	ELaptopApp CurrentApp = ELaptopApp::Case;
	FName SelectedA;
	FName SelectedB;
	FText LastReport;
	bool bLastReportAccepted = false;
	bool bDirty = true;

	UPROPERTY(Transient)
	TObjectPtr<UScrollBox> Content;

	UPROPERTY(Transient)
	TObjectPtr<UVerticalBox> NavBox;

	UPROPERTY(Transient)
	TObjectPtr<UTextBlock> TrustText;

	UPROPERTY(Transient)
	TArray<TObjectPtr<ULaptopClickProxy>> PersistentProxies;

	UPROPERTY(Transient)
	TArray<TObjectPtr<ULaptopClickProxy>> ContentProxies;

	FDelegateHandle ChangedHandle;
};
