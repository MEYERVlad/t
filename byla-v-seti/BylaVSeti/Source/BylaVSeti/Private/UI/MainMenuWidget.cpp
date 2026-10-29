#include "UI/MainMenuWidget.h"

#include "Audio/VoiceSubsystem.h"
#include "Blueprint/WidgetTree.h"
#include "Case/CaseStateSubsystem.h"
#include "Components/Border.h"
#include "Components/Button.h"
#include "Components/HorizontalBox.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/SizeBox.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Engine/GameInstance.h"
#include "GameFramework/GameUserSettings.h"
#include "Gameplay/DetectivePlayerController.h"
#include "InputCoreTypes.h"
#include "Kismet/KismetSystemLibrary.h"
#include "UI/UIStyle.h"

namespace
{
	const FName ActContinue(TEXT("continue"));
	const FName ActNew(TEXT("new"));
	const FName ActNewAsk(TEXT("new_ask"));
	const FName ActSettings(TEXT("settings"));
	const FName ActBack(TEXT("back"));
	const FName ActQuality(TEXT("quality"));
	const FName ActWindow(TEXT("window"));
	const FName ActQuit(TEXT("quit"));
	const FName ActVoice(TEXT("voice"));
}

void UMainMenuWidget::NativeOnInitialized()
{
	Super::NativeOnInitialized();
	SetIsFocusable(true);
}

FReply UMainMenuWidget::NativeOnKeyDown(const FGeometry& InGeometry, const FKeyEvent& InKeyEvent)
{
	// Меню закрывается только выбором «Продолжить» или «Новое дело».
	if (InKeyEvent.GetKey() == EKeys::Escape || InKeyEvent.GetKey() == EKeys::Tab)
	{
		if (bSettings || bConfirmNew)
		{
			HandleAction(ActBack, NAME_None);
		}
		return FReply::Handled();
	}
	return Super::NativeOnKeyDown(InGeometry, InKeyEvent);
}

void UMainMenuWidget::BuildLayout()
{
	UBorder* Root = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass(), TEXT("MenuRoot"));
	Root->SetBrushColor(FLinearColor(0.012f, 0.014f, 0.02f, 0.86f));
	Root->SetPadding(FMargin(140.f, 90.f));
	Root->SetHorizontalAlignment(HAlign_Left);
	Root->SetVerticalAlignment(VAlign_Center);
	WidgetTree->RootWidget = Root;

	USizeBox* Width = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	Width->SetWidthOverride(760.f);
	Body = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	Width->AddChild(Body);
	Root->SetContent(Width);

	Refresh();
}

void UMainMenuWidget::AddRow(UWidget* Widget, float BottomPadding)
{
	if (UVerticalBoxSlot* S = Body->AddChildToVerticalBox(Widget))
	{
		S->SetPadding(FMargin(0.f, 0.f, 0.f, BottomPadding));
	}
}

void UMainMenuWidget::Refresh()
{
	if (!Body)
	{
		return;
	}
	ResetContentButtons();
	Body->ClearChildren();

	const UCaseStateSubsystem* Case = GetCase();
	const bool bHasSave = Case && Case->HasSave();

	AddRow(MakeText(UI(TEXT("menu_title")), 76, BylaUI::Text, true, false), 6.f);
	AddRow(MakeText(UI(TEXT("menu_subtitle")), 24, BylaUI::TextDim), 56.f);

	if (bSettings)
	{
		BuildSettings();
	}
	else
	{
		BuildMain(bHasSave);
	}
}

void UMainMenuWidget::BuildMain(bool bHasSave)
{
	constexpr int32 Font = 26;
	if (bHasSave)
	{
		AddRow(MakeButton(UI(TEXT("menu_continue")), ActContinue, NAME_None, BylaUI::ButtonActive, false, Font), 14.f);
		if (bConfirmNew)
		{
			AddRow(MakeText(UI(TEXT("menu_new_help")), 20, BylaUI::Warning), 8.f);
			AddRow(MakeButton(UI(TEXT("restart_confirm")), ActNew, NAME_None, BylaUI::Danger, false, Font), 14.f);
		}
		else
		{
			AddRow(MakeButton(UI(TEXT("menu_new")), ActNewAsk, NAME_None, BylaUI::Button, false, Font), 14.f);
		}
	}
	else
	{
		AddRow(MakeButton(UI(TEXT("menu_new")), ActNew, NAME_None, BylaUI::ButtonActive, false, Font), 14.f);
	}
	AddRow(MakeButton(UI(TEXT("menu_settings")), ActSettings, NAME_None, BylaUI::Button, false, Font), 14.f);
	AddRow(MakeButton(UI(TEXT("menu_quit")), ActQuit, NAME_None, BylaUI::Button, false, Font), 48.f);
	AddRow(MakeText(UI(TEXT("menu_footer")), 18, BylaUI::TextDim), 0.f);
}

void UMainMenuWidget::BuildSettings()
{
	UGameUserSettings* Settings = UGameUserSettings::GetGameUserSettings();

	AddRow(MakeText(UI(TEXT("quality_header")), 24, BylaUI::Text, true), 8.f);
	AddRow(MakeText(UI(TEXT("quality_help")), 18, BylaUI::TextDim), 12.f);
	{
		const int32 Current = Settings ? Settings->GetOverallScalabilityLevel() : -1;
		UHorizontalBox* Row = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
		for (int32 Level = 0; Level <= 3; ++Level)
		{
			const FText Label = UI(*FString::Printf(TEXT("quality_%d"), Level));
			if (UHorizontalBoxSlot* S = Row->AddChildToHorizontalBox(MakeButton(Label, ActQuality, FName(*FString::FromInt(Level)),
				Level == Current ? BylaUI::ButtonActive : BylaUI::Button)))
			{
				S->SetPadding(FMargin(0.f, 0.f, 8.f, 0.f));
			}
		}
		AddRow(Row, 30.f);
	}

	AddRow(MakeText(UI(TEXT("menu_window_header")), 24, BylaUI::Text, true), 12.f);
	{
		const bool bWindowed = Settings && Settings->GetFullscreenMode() == EWindowMode::Windowed;
		UHorizontalBox* Row = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
		if (UHorizontalBoxSlot* S = Row->AddChildToHorizontalBox(MakeButton(UI(TEXT("menu_fullscreen")), ActWindow, FName(TEXT("full")),
			bWindowed ? BylaUI::Button : BylaUI::ButtonActive)))
		{
			S->SetPadding(FMargin(0.f, 0.f, 8.f, 0.f));
		}
		Row->AddChildToHorizontalBox(MakeButton(UI(TEXT("menu_windowed")), ActWindow, FName(TEXT("window")),
			bWindowed ? BylaUI::ButtonActive : BylaUI::Button));
		AddRow(Row, 30.f);
	}

	// Озвучка: выключить или громкость.
	if (UVoiceSubsystem* Voice = GetGameInstance() ? GetGameInstance()->GetSubsystem<UVoiceSubsystem>() : nullptr)
	{
		AddRow(MakeText(UI(TEXT("menu_voice_header")), 24, BylaUI::Text, true), 12.f);
		UHorizontalBox* Row = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
		const int32 Percent = Voice->IsVoiceEnabled() ? FMath::RoundToInt(Voice->GetVolume() * 100.f) : 0;
		for (const int32 Option : { 0, 50, 75, 100 })
		{
			const FText Label = Option == 0 ? UI(TEXT("menu_voice_off")) : FText::FromString(FString::Printf(TEXT("%d%%"), Option));
			if (UHorizontalBoxSlot* S = Row->AddChildToHorizontalBox(MakeButton(Label, ActVoice, FName(*FString::FromInt(Option)),
				Option == Percent ? BylaUI::ButtonActive : BylaUI::Button)))
			{
				S->SetPadding(FMargin(0.f, 0.f, 8.f, 0.f));
			}
		}
		AddRow(Row, 30.f);
	}

	AddRow(MakeText(UI(TEXT("menu_settings_note")), 18, BylaUI::TextDim), 30.f);
	AddRow(MakeButton(UI(TEXT("menu_back")), ActBack, NAME_None, BylaUI::Button, false, 24), 0.f);
}

void UMainMenuWidget::HandleAction(FName Action, FName Payload)
{
	ADetectivePlayerController* PC = Cast<ADetectivePlayerController>(GetOwningPlayer());

	if (Action == ActContinue || Action == ActNew)
	{
		if (PC)
		{
			PC->BeginCase(Action == ActContinue);
		}
		return;
	}
	if (Action == ActQuit)
	{
		UKismetSystemLibrary::QuitGame(this, PC, EQuitPreference::Quit, false);
		return;
	}

	if (Action == ActNewAsk)
	{
		bConfirmNew = true;
	}
	else if (Action == ActSettings)
	{
		bSettings = true;
		bConfirmNew = false;
	}
	else if (Action == ActBack)
	{
		bSettings = false;
		bConfirmNew = false;
	}
	else if (Action == ActVoice)
	{
		if (UVoiceSubsystem* Voice = GetGameInstance() ? GetGameInstance()->GetSubsystem<UVoiceSubsystem>() : nullptr)
		{
			const int32 Option = FCString::Atoi(*Payload.ToString());
			Voice->SetVoiceEnabled(Option > 0);
			if (Option > 0)
			{
				Voice->SetVolume(Option / 100.f);
			}
		}
	}
	else if (Action == ActQuality || Action == ActWindow)
	{
		if (UGameUserSettings* Settings = UGameUserSettings::GetGameUserSettings())
		{
			if (Action == ActQuality)
			{
				Settings->SetOverallScalabilityLevel(FCString::Atoi(*Payload.ToString()));
			}
			else
			{
				Settings->SetFullscreenMode(Payload == FName(TEXT("window")) ? EWindowMode::Windowed : EWindowMode::WindowedFullscreen);
			}
			Settings->ApplySettings(false);
			Settings->SaveSettings();
		}
	}
	MarkDirty();
}
