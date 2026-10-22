#include "UI/BylaPanelWidget.h"

#include "Blueprint/WidgetTree.h"
#include "Case/CaseStateSubsystem.h"
#include "Components/Border.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"
#include "Engine/GameInstance.h"
#include "UI/UIStyle.h"

void UBylaClickProxy::HandleClicked()
{
	if (UBylaPanelWidget* Widget = Owner.Get())
	{
		Widget->HandleAction(Action, Payload);
	}
}

TSharedRef<SWidget> UBylaPanelWidget::RebuildWidget()
{
	if (WidgetTree && !WidgetTree->RootWidget)
	{
		BuildLayout();
	}
	return Super::RebuildWidget();
}

void UBylaPanelWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (UCaseStateSubsystem* Case = GetCase())
	{
		ChangedHandle = Case->OnCaseChanged.AddWeakLambda(this, [this]() { bDirty = true; });
	}
	bDirty = true;
}

void UBylaPanelWidget::NativeDestruct()
{
	if (UCaseStateSubsystem* Case = GetCase())
	{
		Case->OnCaseChanged.Remove(ChangedHandle);
	}
	Super::NativeDestruct();
}

void UBylaPanelWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
	Super::NativeTick(MyGeometry, InDeltaTime);
	// Перерисовываем на следующем кадре, а не внутри обработчика клика.
	if (bDirty)
	{
		bDirty = false;
		Refresh();
	}
}

UCaseStateSubsystem* UBylaPanelWidget::GetCase() const
{
	const UGameInstance* GI = GetGameInstance();
	return GI ? GI->GetSubsystem<UCaseStateSubsystem>() : nullptr;
}

FText UBylaPanelWidget::UI(const TCHAR* Key) const
{
	const UCaseStateSubsystem* Case = GetCase();
	return Case ? Case->UI(FName(Key)) : FText::FromString(Key);
}

UTextBlock* UBylaPanelWidget::MakeText(const FText& Text, int32 Size, const FLinearColor& Color, bool bBold, bool bWrap)
{
	UTextBlock* Block = WidgetTree->ConstructWidget<UTextBlock>(UTextBlock::StaticClass());
	Block->SetText(Text);
	Block->SetFont(BylaUI::Font(Size, bBold));
	Block->SetColorAndOpacity(FSlateColor(Color));
	Block->SetAutoWrapText(bWrap);
	return Block;
}

UButton* UBylaPanelWidget::MakeButton(const FText& Label, FName Action, FName Payload, const FLinearColor& Color, bool bPersistent, int32 FontSize)
{
	UButton* Button = WidgetTree->ConstructWidget<UButton>(UButton::StaticClass());
	Button->SetBackgroundColor(Color);
	Button->AddChild(MakeText(Label, FontSize, BylaUI::Text, false, false));

	UBylaClickProxy* Proxy = NewObject<UBylaClickProxy>(this);
	Proxy->Owner = this;
	Proxy->Action = Action;
	Proxy->Payload = Payload;
	Button->OnClicked.AddDynamic(Proxy, &UBylaClickProxy::HandleClicked);

	if (bPersistent)
	{
		PersistentProxies.Add(Proxy);
	}
	else
	{
		ContentProxies.Add(Proxy);
	}
	return Button;
}

UWidget* UBylaPanelWidget::MakeCard(UWidget* Inner, const FLinearColor& Color, float Padding)
{
	UBorder* Card = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
	Card->SetBrushColor(Color);
	Card->SetPadding(FMargin(Padding + 2.f, Padding));
	Card->SetContent(Inner);
	return Card;
}

void UBylaPanelWidget::ResetContentButtons()
{
	ContentProxies.Reset();
}
