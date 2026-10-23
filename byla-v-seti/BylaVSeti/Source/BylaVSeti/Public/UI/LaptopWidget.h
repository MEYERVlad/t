#pragma once

#include "CoreMinimal.h"
#include "UI/BylaPanelWidget.h"
#include "LaptopWidget.generated.h"

class UBorder;
class UBoardWidget;
class UEditableTextBox;
class UScrollBox;
class UTextBlock;
class UTwitchChatSubsystem;
class UVerticalBox;
class UWidget;

enum class ELaptopApp : uint8
{
	Case,
	Krug,
	Mail,
	Board,
	Decisions,
	Hint,
	Stream
};

/**
 * Служебный ноутбук: «Материалы дела», «Круг», «Почта», доска «СЛЕД», «Решения», «Стрим».
 * Весь интерфейс собирается в коде, Widget Blueprint не нужен.
 */
UCLASS()
class BYLAVSETI_API ULaptopWidget : public UBylaPanelWidget
{
	GENERATED_BODY()

public:
	virtual void HandleAction(FName Action, FName Payload) override;

protected:
	virtual void NativeOnInitialized() override;
	virtual void NativeConstruct() override;
	virtual void NativeDestruct() override;
	virtual FReply NativeOnKeyDown(const FGeometry& InGeometry, const FKeyEvent& InKeyEvent) override;
	virtual void BuildLayout() override;
	virtual void Refresh() override;

private:
	UTwitchChatSubsystem* GetTwitch() const;

	void BuildNav();
	void BuildCaseApp();
	void BuildFeedApp(FName Channel);
	void BuildDecisionsApp();
	void BuildStreamApp();
	void BuildHintApp();
	void AddContent(UWidget* Widget, float BottomPadding = 12.f);

	ELaptopApp CurrentApp = ELaptopApp::Case;
	bool bConfirmRestart = false;
	FName RevealedHint;

	UPROPERTY(Transient)
	TObjectPtr<UBorder> ContentPanel;

	UPROPERTY(Transient)
	TObjectPtr<UScrollBox> Content;

	UPROPERTY(Transient)
	TObjectPtr<UBoardWidget> Board;

	UPROPERTY(Transient)
	TObjectPtr<UVerticalBox> NavBox;

	UPROPERTY(Transient)
	TObjectPtr<UTextBlock> TrustText;

	UPROPERTY(Transient)
	TObjectPtr<UEditableTextBox> ChannelInput;

	FDelegateHandle TwitchHandle;
};
