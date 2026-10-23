#include "UI/GameHudWidget.h"

#include "Blueprint/WidgetTree.h"
#include "Components/Border.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Components/SizeBox.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"
#include "Stream/TwitchChatSubsystem.h"
#include "UI/UIStyle.h"

TSharedRef<SWidget> UGameHudWidget::RebuildWidget()
{
	if (WidgetTree && !WidgetTree->RootWidget)
	{
		BuildLayout();
	}
	return Super::RebuildWidget();
}

void UGameHudWidget::BuildLayout()
{
	UCanvasPanel* Canvas = WidgetTree->ConstructWidget<UCanvasPanel>(UCanvasPanel::StaticClass(), TEXT("HudCanvas"));
	WidgetTree->RootWidget = Canvas;
	SetVisibility(ESlateVisibility::HitTestInvisible);

	// Точка прицела.
	UTextBlock* Dot = WidgetTree->ConstructWidget<UTextBlock>(UTextBlock::StaticClass());
	Dot->SetText(FText::FromString(TEXT("+")));
	Dot->SetFont(BylaUI::Font(18));
	Dot->SetColorAndOpacity(FSlateColor(FLinearColor(1.f, 1.f, 1.f, 0.6f)));
	if (UCanvasPanelSlot* S = Canvas->AddChildToCanvas(Dot))
	{
		S->SetAnchors(FAnchors(0.5f, 0.5f));
		S->SetAlignment(FVector2D(0.5f, 0.5f));
		S->SetAutoSize(true);
		S->SetPosition(FVector2D::ZeroVector);
	}

	// Подсказка взаимодействия.
	PromptText = WidgetTree->ConstructWidget<UTextBlock>(UTextBlock::StaticClass());
	PromptText->SetFont(BylaUI::Font(24));
	PromptText->SetColorAndOpacity(FSlateColor(BylaUI::Text));
	PromptText->SetShadowOffset(FVector2D(1.f, 1.f));
	PromptText->SetShadowColorAndOpacity(FLinearColor(0.f, 0.f, 0.f, 0.9f));
	if (UCanvasPanelSlot* S = Canvas->AddChildToCanvas(PromptText))
	{
		S->SetAnchors(FAnchors(0.5f, 0.58f));
		S->SetAlignment(FVector2D(0.5f, 0.f));
		S->SetAutoSize(true);
		S->SetPosition(FVector2D::ZeroVector);
	}

	// Доверие начальства.
	TrustText = WidgetTree->ConstructWidget<UTextBlock>(UTextBlock::StaticClass());
	TrustText->SetFont(BylaUI::Font(22, true));
	TrustText->SetColorAndOpacity(FSlateColor(BylaUI::Accent));
	TrustText->SetShadowOffset(FVector2D(1.f, 1.f));
	TrustSlot = Canvas->AddChildToCanvas(TrustText);
	if (TrustSlot)
	{
		TrustSlot->SetAutoSize(true);
	}

	// Уведомления (правый верхний угол).
	USizeBox* ToastSize = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	ToastSize->SetWidthOverride(560.f);
	ToastBox = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	ToastSize->AddChild(ToastBox);
	ToastSlot = Canvas->AddChildToCanvas(ToastSize);
	if (ToastSlot)
	{
		ToastSlot->SetAutoSize(true);
	}

	ApplyFacecamLayout();
	SetPrompt(CurrentPrompt);
}

void UGameHudWidget::NativeConstruct()
{
	Super::NativeConstruct();
	const UGameInstance* GI = GetGameInstance();
	if (UTwitchChatSubsystem* Twitch = GI ? GI->GetSubsystem<UTwitchChatSubsystem>() : nullptr)
	{
		TwitchHandle = Twitch->OnChanged.AddUObject(this, &UGameHudWidget::ApplyFacecamLayout);
	}
	ApplyFacecamLayout();
}

void UGameHudWidget::NativeDestruct()
{
	const UGameInstance* GI = GetGameInstance();
	if (UTwitchChatSubsystem* Twitch = GI ? GI->GetSubsystem<UTwitchChatSubsystem>() : nullptr)
	{
		Twitch->OnChanged.Remove(TwitchHandle);
	}
	Super::NativeDestruct();
}

void UGameHudWidget::ApplyFacecamLayout()
{
	if (!TrustSlot || !ToastSlot)
	{
		return;
	}
	const UGameInstance* GI = GetGameInstance();
	const UTwitchChatSubsystem* Twitch = GI ? GI->GetSubsystem<UTwitchChatSubsystem>() : nullptr;
	const int32 Corner = Twitch ? Twitch->GetFacecamCorner() : 0;

	// Доверие: слева сверху, а если там камера — слева снизу.
	if (Corner == 1)
	{
		TrustSlot->SetAnchors(FAnchors(0.f, 1.f));
		TrustSlot->SetAlignment(FVector2D(0.f, 1.f));
		TrustSlot->SetPosition(FVector2D(40.f, -32.f));
	}
	else
	{
		TrustSlot->SetAnchors(FAnchors(0.f, 0.f));
		TrustSlot->SetAlignment(FVector2D(0.f, 0.f));
		TrustSlot->SetPosition(FVector2D(40.f, 32.f));
	}

	// Уведомления: справа сверху, а если там камера — справа снизу (над нижним краем).
	if (Corner == 2)
	{
		ToastSlot->SetAnchors(FAnchors(1.f, 1.f));
		ToastSlot->SetAlignment(FVector2D(1.f, 1.f));
		ToastSlot->SetPosition(FVector2D(-40.f, -40.f));
	}
	else
	{
		ToastSlot->SetAnchors(FAnchors(1.f, 0.f));
		ToastSlot->SetAlignment(FVector2D(1.f, 0.f));
		ToastSlot->SetPosition(FVector2D(-40.f, 32.f));
	}
}

void UGameHudWidget::SetPrompt(const FText& Prompt)
{
	// Вызывается каждый кадр: не трогаем текст, если он не изменился.
	if (PromptText && Prompt.EqualTo(CurrentPrompt) && PromptText->GetText().IsEmpty() == Prompt.IsEmpty())
	{
		return;
	}
	CurrentPrompt = Prompt;
	if (!PromptText)
	{
		return;
	}
	if (Prompt.IsEmpty())
	{
		PromptText->SetText(FText::GetEmpty());
	}
	else
	{
		PromptText->SetText(FText::Format(FText::FromString(TEXT("[E]  {0}")), Prompt));
	}
}

void UGameHudWidget::SetTrust(int32 Value, const FText& Label)
{
	if (TrustText)
	{
		TrustText->SetText(FText::Format(FText::FromString(TEXT("{0}: {1}")), Label, FText::AsNumber(Value)));
		TrustText->SetColorAndOpacity(FSlateColor(Value < 30 ? BylaUI::Danger : BylaUI::Accent));
	}
}

void UGameHudWidget::AddToast(const FText& Message)
{
	const UWorld* World = GetWorld();
	FToast Toast;
	Toast.Text = Message;
	Toast.ExpireTime = (World ? World->GetTimeSeconds() : 0.0) + ToastSeconds;
	Toasts.Add(Toast);
	while (Toasts.Num() > MaxToasts)
	{
		Toasts.RemoveAt(0);
	}
	RebuildToasts();
}

void UGameHudWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
	Super::NativeTick(MyGeometry, InDeltaTime);

	const UWorld* World = GetWorld();
	if (!World || Toasts.Num() == 0)
	{
		return;
	}
	const double Now = World->GetTimeSeconds();
	const int32 Removed = Toasts.RemoveAll([Now](const FToast& T) { return T.ExpireTime <= Now; });
	if (Removed > 0)
	{
		RebuildToasts();
	}
}

void UGameHudWidget::RebuildToasts()
{
	if (!ToastBox)
	{
		return;
	}
	ToastBox->ClearChildren();
	for (const FToast& Toast : Toasts)
	{
		UBorder* Card = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
		Card->SetBrushColor(FLinearColor(0.02f, 0.025f, 0.035f, 0.88f));
		Card->SetPadding(FMargin(18.f, 12.f));

		UTextBlock* Text = WidgetTree->ConstructWidget<UTextBlock>(UTextBlock::StaticClass());
		Text->SetText(Toast.Text);
		Text->SetFont(BylaUI::Font(20));
		Text->SetColorAndOpacity(FSlateColor(BylaUI::Text));
		Text->SetAutoWrapText(true);
		Card->SetContent(Text);

		if (UVerticalBoxSlot* S = ToastBox->AddChildToVerticalBox(Card))
		{
			S->SetPadding(FMargin(0.f, 0.f, 0.f, 8.f));
		}
	}
}
