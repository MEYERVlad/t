#include "Gameplay/DetectivePlayerController.h"

#include "Case/CaseStateSubsystem.h"
#include "Engine/GameInstance.h"
#include "HAL/IConsoleManager.h"
#include "Kismet/KismetSystemLibrary.h"
#include "TimerManager.h"
#include "UI/EndingWidget.h"
#include "UI/GameHudWidget.h"
#include "UI/InterrogationWidget.h"
#include "UI/LaptopWidget.h"
#include "UI/MainMenuWidget.h"
#include "UI/PollOverlayWidget.h"

UCaseStateSubsystem* ADetectivePlayerController::GetCase() const
{
	const UGameInstance* GI = GetGameInstance();
	return GI ? GI->GetSubsystem<UCaseStateSubsystem>() : nullptr;
}

void ADetectivePlayerController::BylaShowAll()
{
	if (UCaseStateSubsystem* Case = GetCase())
	{
		Case->SetShowAllObjects(!Case->GetShowAllObjects());
		ShowToast(FText::FromString(Case->GetShowAllObjects() ? TEXT("Debug: show all ON") : TEXT("Debug: show all OFF")));
	}
}

void ADetectivePlayerController::BylaFlag(FName Flag)
{
	if (UCaseStateSubsystem* Case = GetCase())
	{
		Case->SetFlag(Flag);
		ShowToast(FText::FromString(FString::Printf(TEXT("Debug: flag %s"), *Flag.ToString())));
	}
}

void ADetectivePlayerController::BeginPlay()
{
	Super::BeginPlay();

	// MetaHuman-персонажи тяжёлые по текстурам: стандартного пула не хватает (красная надпись
	// «размер подгружаемых данных текстуры превышает лимит»). 3 ГБ подходит для карт с 8 ГБ памяти.
	if (IConsoleVariable* Pool = IConsoleManager::Get().FindConsoleVariable(TEXT("r.Streaming.PoolSize")))
	{
		if (Pool->GetInt() < 3000)
		{
			Pool->Set(3000, ECVF_SetByCode);
		}
	}

	if (!IsLocalController())
	{
		return;
	}

	Hud = CreateWidget<UGameHudWidget>(this, UGameHudWidget::StaticClass());
	if (Hud)
	{
		Hud->AddToViewport(0);
	}

	// Голосование чата поверх всего, включая ноутбук и допрос.
	if (UPollOverlayWidget* Poll = CreateWidget<UPollOverlayWidget>(this, UPollOverlayWidget::StaticClass()))
	{
		Poll->AddToViewport(50);
	}

	// Дело ещё не начато в этом запуске игры — сначала главное меню (открываем в конце BeginPlay).
	// При переезде между локациями дело уже идёт, и меню не показываем.
	bool bShowMenu = false;
	if (UCaseStateSubsystem* Case = GetCase())
	{
		bShowMenu = !Case->HasFlag(TEXT("start"));
		EvidenceHandle = Case->OnEvidenceAdded.AddUObject(this, &ADetectivePlayerController::HandleEvidenceAdded);
		FeedHandle = Case->OnFeedPublished.AddUObject(this, &ADetectivePlayerController::HandleFeedPublished);
		ChangedHandle = Case->OnCaseChanged.AddUObject(this, &ADetectivePlayerController::HandleCaseChanged);
		EndingHandle = Case->OnEndingReached.AddUObject(this, &ADetectivePlayerController::HandleEndingReached);
		HandleCaseChanged();
	}

	SetInputMode(FInputModeGameOnly());
	bShowMouseCursor = false;

	GetWorldTimerManager().SetTimer(StuckTimer, this, &ADetectivePlayerController::CheckStuck, 20.f, true);

	if (bShowMenu)
	{
		OpenPanel(CreateWidget<UMainMenuWidget>(this, UMainMenuWidget::StaticClass()));
	}
}

void ADetectivePlayerController::BeginCase(bool bContinue)
{
	UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}
	FText Greeting;
	if (bContinue && Case->LoadCase())
	{
		Greeting = Case->UI(TEXT("toast_continue"));
	}
	else
	{
		Case->StartNewCase();
		Greeting = Case->UI(TEXT("toast_welcome"));
	}
	// Закрываем меню на следующем кадре, не внутри обработчика его же кнопки.
	GetWorldTimerManager().SetTimerForNextTick(FTimerDelegate::CreateWeakLambda(this, [this, Greeting]()
	{
		ClosePanel();
		ShowToast(Greeting);
	}));
}

void ADetectivePlayerController::ExitGame()
{
	UKismetSystemLibrary::QuitGame(this, this, EQuitPreference::Quit, false);
}

void ADetectivePlayerController::CheckStuck()
{
	static constexpr double StuckSeconds = 300.0;
	UCaseStateSubsystem* Case = GetCase();
	if (!Case || ActivePanel || Case->GetSecondsSinceProgress() < StuckSeconds)
	{
		return;
	}
	const FCaseHint* Hint = Case->GetCurrentHint();
	if (Hint && Hint->Id != LastNudgedHint)
	{
		LastNudgedHint = Hint->Id;
		ShowToast(Case->UI(TEXT("toast_hint_nudge")));
	}
}

void ADetectivePlayerController::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
	if (UCaseStateSubsystem* Case = GetCase())
	{
		Case->OnEvidenceAdded.Remove(EvidenceHandle);
		Case->OnFeedPublished.Remove(FeedHandle);
		Case->OnCaseChanged.Remove(ChangedHandle);
		Case->OnEndingReached.Remove(EndingHandle);
	}
	Super::EndPlay(EndPlayReason);
}

void ADetectivePlayerController::OpenLaptop()
{
	OpenPanel(CreateWidget<ULaptopWidget>(this, ULaptopWidget::StaticClass()));
}

void ADetectivePlayerController::OpenInterrogation(FName InterrogationId)
{
	UInterrogationWidget* Widget = CreateWidget<UInterrogationWidget>(this, UInterrogationWidget::StaticClass());
	if (Widget)
	{
		Widget->SetInterrogation(InterrogationId);
	}
	OpenPanel(Widget);
}

void ADetectivePlayerController::OpenEnding(FName EndingId)
{
	UEndingWidget* Widget = CreateWidget<UEndingWidget>(this, UEndingWidget::StaticClass());
	if (Widget)
	{
		Widget->SetEnding(EndingId);
	}
	OpenPanel(Widget);
}

void ADetectivePlayerController::HandleEndingReached(FName EndingId)
{
	// Концовка обычно наступает по клику в ноутбуке: закрываем его на следующем кадре, не внутри обработчика.
	GetWorldTimerManager().SetTimerForNextTick(FTimerDelegate::CreateWeakLambda(this, [this, EndingId]()
	{
		ClosePanel();
		OpenEnding(EndingId);
	}));
}

void ADetectivePlayerController::OpenPanel(UBylaPanelWidget* Panel)
{
	if (ActivePanel || !Panel)
	{
		return;
	}
	ActivePanel = Panel;
	ActivePanel->AddToViewport(10);

	FInputModeUIOnly Mode;
	Mode.SetWidgetToFocus(ActivePanel->TakeWidget());
	Mode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
	SetInputMode(Mode);
	bShowMouseCursor = true;

	SetInteractionPrompt(FText::GetEmpty());
}

void ADetectivePlayerController::ClosePanel()
{
	if (!ActivePanel)
	{
		return;
	}
	ActivePanel->RemoveFromParent();
	ActivePanel = nullptr;

	SetInputMode(FInputModeGameOnly());
	bShowMouseCursor = false;
}

void ADetectivePlayerController::ShowToast(const FText& Message)
{
	if (Hud && !Message.IsEmpty())
	{
		Hud->AddToast(Message);
	}
}

void ADetectivePlayerController::SetInteractionPrompt(const FText& Prompt)
{
	if (Hud)
	{
		Hud->SetPrompt(ActivePanel ? FText::GetEmpty() : Prompt);
	}
}

void ADetectivePlayerController::HandleEvidenceAdded(FName Id)
{
	UCaseStateSubsystem* Case = GetCase();
	const FCaseEvidence* E = Case ? Case->FindEvidence(Id) : nullptr;
	if (E)
	{
		ShowToast(FText::Format(Case->UI(TEXT("toast_evidence")), E->Title));
	}
}

void ADetectivePlayerController::HandleFeedPublished(FName Id)
{
	UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}
	// Ищем запись среди опубликованных в обоих каналах.
	for (const FName Channel : { FName(TEXT("krug")), FName(TEXT("mail")) })
	{
		for (const FCaseFeedItem* Item : Case->GetPublishedFeed(Channel))
		{
			if (Item->Id == Id)
			{
				const FName Key = Channel == TEXT("mail") ? FName(TEXT("toast_mail")) : FName(TEXT("toast_post"));
				ShowToast(FText::Format(Case->UI(Key), Item->Author));
				return;
			}
		}
	}
}

void ADetectivePlayerController::HandleCaseChanged()
{
	if (UCaseStateSubsystem* Case = GetCase())
	{
		if (Hud)
		{
			Hud->SetTrust(Case->GetTrust(), Case->UI(TEXT("trust")));
		}
	}
}
