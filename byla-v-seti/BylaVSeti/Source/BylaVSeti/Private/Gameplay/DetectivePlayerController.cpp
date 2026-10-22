#include "Gameplay/DetectivePlayerController.h"

#include "Case/CaseStateSubsystem.h"
#include "Engine/GameInstance.h"
#include "UI/GameHudWidget.h"
#include "UI/InterrogationWidget.h"
#include "UI/LaptopWidget.h"

UCaseStateSubsystem* ADetectivePlayerController::GetCase() const
{
	const UGameInstance* GI = GetGameInstance();
	return GI ? GI->GetSubsystem<UCaseStateSubsystem>() : nullptr;
}

void ADetectivePlayerController::BeginPlay()
{
	Super::BeginPlay();

	if (!IsLocalController())
	{
		return;
	}

	Hud = CreateWidget<UGameHudWidget>(this, UGameHudWidget::StaticClass());
	if (Hud)
	{
		Hud->AddToViewport(0);
	}

	if (UCaseStateSubsystem* Case = GetCase())
	{
		if (!Case->HasFlag(TEXT("start")))
		{
			Case->StartNewCase();
		}
		EvidenceHandle = Case->OnEvidenceAdded.AddUObject(this, &ADetectivePlayerController::HandleEvidenceAdded);
		FeedHandle = Case->OnFeedPublished.AddUObject(this, &ADetectivePlayerController::HandleFeedPublished);
		ChangedHandle = Case->OnCaseChanged.AddUObject(this, &ADetectivePlayerController::HandleCaseChanged);
		HandleCaseChanged();
		ShowToast(Case->UI(TEXT("toast_welcome")));
	}

	SetInputMode(FInputModeGameOnly());
	bShowMouseCursor = false;
}

void ADetectivePlayerController::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
	if (UCaseStateSubsystem* Case = GetCase())
	{
		Case->OnEvidenceAdded.Remove(EvidenceHandle);
		Case->OnFeedPublished.Remove(FeedHandle);
		Case->OnCaseChanged.Remove(ChangedHandle);
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
