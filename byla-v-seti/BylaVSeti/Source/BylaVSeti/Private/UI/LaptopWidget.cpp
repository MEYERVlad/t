#include "UI/LaptopWidget.h"

#include "Blueprint/WidgetTree.h"
#include "Case/CaseStateSubsystem.h"
#include "Components/Border.h"
#include "Components/Button.h"
#include "Components/HorizontalBox.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/ScrollBox.h"
#include "Components/ScrollBoxSlot.h"
#include "Components/SizeBox.h"
#include "Components/Spacer.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Components/WrapBox.h"
#include "Components/WrapBoxSlot.h"
#include "Engine/GameInstance.h"
#include "Gameplay/DetectivePlayerController.h"
#include "InputCoreTypes.h"
#include "UI/UIStyle.h"

namespace
{
	const FName ActClose(TEXT("close"));
	const FName ActApp(TEXT("app"));
	const FName ActSelect(TEXT("select"));
	const FName ActLink(TEXT("link"));
	const FName ActUnlink(TEXT("unlink"));
	const FName ActReport(TEXT("report"));
	const FName ActDecide(TEXT("decide"));
	const FName ActClearSelection(TEXT("clear_selection"));

	const TCHAR* LinkTypes[] = { TEXT("points_to"), TEXT("contradicts"), TEXT("alibi"), TEXT("wrote"), TEXT("was_at"), TEXT("owns") };

	struct FAppInfo
	{
		ELaptopApp App;
		const TCHAR* Id;
		const TCHAR* UIKey;
	};
	const FAppInfo Apps[] = {
		{ ELaptopApp::Case, TEXT("case"), TEXT("app_case") },
		{ ELaptopApp::Krug, TEXT("krug"), TEXT("app_krug") },
		{ ELaptopApp::Mail, TEXT("mail"), TEXT("app_mail") },
		{ ELaptopApp::Board, TEXT("board"), TEXT("app_board") },
		{ ELaptopApp::Decisions, TEXT("decisions"), TEXT("app_decisions") },
	};
}

// ================================================================ Посредник кнопки

void ULaptopClickProxy::HandleClicked()
{
	if (ULaptopWidget* Widget = Owner.Get())
	{
		Widget->HandleAction(Action, Payload);
	}
}

// ================================================================ Жизненный цикл

void ULaptopWidget::NativeOnInitialized()
{
	Super::NativeOnInitialized();
	SetIsFocusable(true);
}

TSharedRef<SWidget> ULaptopWidget::RebuildWidget()
{
	if (WidgetTree && !WidgetTree->RootWidget)
	{
		BuildLayout();
	}
	return Super::RebuildWidget();
}

void ULaptopWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (UCaseStateSubsystem* Case = GetCase())
	{
		ChangedHandle = Case->OnCaseChanged.AddWeakLambda(this, [this]() { bDirty = true; });
	}
	bDirty = true;
}

void ULaptopWidget::NativeDestruct()
{
	if (UCaseStateSubsystem* Case = GetCase())
	{
		Case->OnCaseChanged.Remove(ChangedHandle);
	}
	Super::NativeDestruct();
}

void ULaptopWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
	Super::NativeTick(MyGeometry, InDeltaTime);
	// Перерисовываем на следующем кадре, а не внутри обработчика клика.
	if (bDirty)
	{
		bDirty = false;
		Refresh();
	}
}

FReply ULaptopWidget::NativeOnKeyDown(const FGeometry& InGeometry, const FKeyEvent& InKeyEvent)
{
	const FKey Key = InKeyEvent.GetKey();
	if (Key == EKeys::Tab || Key == EKeys::Escape)
	{
		HandleAction(ActClose, NAME_None);
		return FReply::Handled();
	}
	return Super::NativeOnKeyDown(InGeometry, InKeyEvent);
}

UCaseStateSubsystem* ULaptopWidget::GetCase() const
{
	const UGameInstance* GI = GetGameInstance();
	return GI ? GI->GetSubsystem<UCaseStateSubsystem>() : nullptr;
}

FText ULaptopWidget::UI(const TCHAR* Key) const
{
	const UCaseStateSubsystem* Case = GetCase();
	return Case ? Case->UI(FName(Key)) : FText::FromString(Key);
}

// ================================================================ Конструкторы виджетов

UTextBlock* ULaptopWidget::MakeText(const FText& Text, int32 Size, const FLinearColor& Color, bool bBold, bool bWrap)
{
	UTextBlock* Block = WidgetTree->ConstructWidget<UTextBlock>(UTextBlock::StaticClass());
	Block->SetText(Text);
	Block->SetFont(BylaUI::Font(Size, bBold));
	Block->SetColorAndOpacity(FSlateColor(Color));
	Block->SetAutoWrapText(bWrap);
	return Block;
}

UButton* ULaptopWidget::MakeButton(const FText& Label, FName Action, FName Payload, const FLinearColor& Color, bool bPersistent)
{
	UButton* Button = WidgetTree->ConstructWidget<UButton>(UButton::StaticClass());
	Button->SetBackgroundColor(Color);

	UTextBlock* Text = MakeText(Label, 20, BylaUI::Text, false, false);
	Button->AddChild(Text);

	ULaptopClickProxy* Proxy = NewObject<ULaptopClickProxy>(this);
	Proxy->Owner = this;
	Proxy->Action = Action;
	Proxy->Payload = Payload;
	Button->OnClicked.AddDynamic(Proxy, &ULaptopClickProxy::HandleClicked);

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

UWidget* ULaptopWidget::MakeCard(UWidget* Inner, const FLinearColor& Color)
{
	UBorder* Card = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
	Card->SetBrushColor(Color);
	Card->SetPadding(FMargin(18.f, 14.f));
	Card->SetContent(Inner);
	return Card;
}

void ULaptopWidget::AddContent(UWidget* Widget, float BottomPadding)
{
	if (UScrollBoxSlot* S = Cast<UScrollBoxSlot>(Content->AddChild(Widget)))
	{
		S->SetPadding(FMargin(0.f, 0.f, 0.f, BottomPadding));
	}
}

FText ULaptopWidget::EvidenceTitle(FName Id) const
{
	const UCaseStateSubsystem* Case = GetCase();
	const FCaseEvidence* E = Case ? Case->FindEvidence(Id) : nullptr;
	return E ? E->Title : FText::FromName(Id);
}

FText ULaptopWidget::LinkTypeName(FName Type) const
{
	return UI(*FString::Printf(TEXT("link_%s"), *Type.ToString()));
}

// ================================================================ Каркас

void ULaptopWidget::BuildLayout()
{
	UBorder* Root = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass(), TEXT("LaptopRoot"));
	Root->SetBrushColor(BylaUI::Background);
	Root->SetPadding(FMargin(36.f, 28.f));
	WidgetTree->RootWidget = Root;

	UVerticalBox* Column = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	Root->SetContent(Column);

	// Шапка: название системы, доверие, кнопка «Закрыть».
	UHorizontalBox* Header = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
	if (UHorizontalBoxSlot* S = Header->AddChildToHorizontalBox(MakeText(UI(TEXT("laptop_title")), 26, BylaUI::Accent, true, false)))
	{
		S->SetVerticalAlignment(VAlign_Center);
	}
	USpacer* Spacer = WidgetTree->ConstructWidget<USpacer>(USpacer::StaticClass());
	if (UHorizontalBoxSlot* S = Header->AddChildToHorizontalBox(Spacer))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}
	TrustText = MakeText(FText::GetEmpty(), 22, BylaUI::Warning, true, false);
	if (UHorizontalBoxSlot* S = Header->AddChildToHorizontalBox(TrustText))
	{
		S->SetVerticalAlignment(VAlign_Center);
		S->SetPadding(FMargin(0.f, 0.f, 24.f, 0.f));
	}
	Header->AddChildToHorizontalBox(MakeButton(UI(TEXT("close")), ActClose, NAME_None, BylaUI::Danger, true));

	if (UVerticalBoxSlot* S = Column->AddChildToVerticalBox(Header))
	{
		S->SetPadding(FMargin(0.f, 0.f, 0.f, 18.f));
	}

	// Тело: меню приложений слева, содержимое справа.
	UHorizontalBox* Body = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());

	USizeBox* NavSize = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	NavSize->SetWidthOverride(280.f);
	NavBox = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	NavSize->AddChild(NavBox);
	if (UHorizontalBoxSlot* S = Body->AddChildToHorizontalBox(NavSize))
	{
		S->SetPadding(FMargin(0.f, 0.f, 24.f, 0.f));
	}

	UBorder* ContentPanel = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
	ContentPanel->SetBrushColor(BylaUI::Panel);
	ContentPanel->SetPadding(FMargin(28.f, 24.f));
	Content = WidgetTree->ConstructWidget<UScrollBox>(UScrollBox::StaticClass());
	ContentPanel->SetContent(Content);
	if (UHorizontalBoxSlot* S = Body->AddChildToHorizontalBox(ContentPanel))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}

	if (UVerticalBoxSlot* S = Column->AddChildToVerticalBox(Body))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}

	Refresh();
}

void ULaptopWidget::BuildNav()
{
	NavBox->ClearChildren();
	const UCaseStateSubsystem* Case = GetCase();

	for (const FAppInfo& Info : Apps)
	{
		FText Label = UI(Info.UIKey);
		// Счётчик доступных решений, чтобы игрок их не пропустил.
		if (Info.App == ELaptopApp::Decisions && Case)
		{
			const int32 Count = Case->GetAvailableDecisions().Num();
			if (Count > 0)
			{
				Label = FText::Format(FText::FromString(TEXT("{0}  ({1})")), Label, FText::AsNumber(Count));
			}
		}
		const FLinearColor Color = (Info.App == CurrentApp) ? BylaUI::ButtonActive : BylaUI::Button;
		if (UVerticalBoxSlot* S = NavBox->AddChildToVerticalBox(MakeButton(Label, ActApp, FName(Info.Id), Color)))
		{
			S->SetPadding(FMargin(0.f, 0.f, 0.f, 10.f));
			S->SetHorizontalAlignment(HAlign_Fill);
		}
	}
}

void ULaptopWidget::Refresh()
{
	if (!Content || !NavBox)
	{
		return;
	}
	ContentProxies.Reset();
	Content->ClearChildren();
	BuildNav();

	if (const UCaseStateSubsystem* Case = GetCase())
	{
		TrustText->SetText(FText::Format(FText::FromString(TEXT("{0}: {1}")), UI(TEXT("trust")), FText::AsNumber(Case->GetTrust())));
	}

	switch (CurrentApp)
	{
	case ELaptopApp::Case:      BuildCaseApp(); break;
	case ELaptopApp::Krug:      BuildFeedApp(TEXT("krug")); break;
	case ELaptopApp::Mail:      BuildFeedApp(TEXT("mail")); break;
	case ELaptopApp::Board:     BuildBoardApp(); break;
	case ELaptopApp::Decisions: BuildDecisionsApp(); break;
	}
}

// ================================================================ Приложения

void ULaptopWidget::BuildCaseApp()
{
	const UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}
	const TArray<FName>& Known = Case->GetKnownEvidence();
	AddContent(MakeText(FText::Format(UI(TEXT("case_header")), FText::AsNumber(Known.Num())), 28, BylaUI::Text, true), 18.f);

	// Новые улики сверху.
	for (int32 i = Known.Num() - 1; i >= 0; --i)
	{
		const FCaseEvidence* E = Case->FindEvidence(Known[i]);
		if (!E)
		{
			continue;
		}
		UVerticalBox* Box = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		Box->AddChildToVerticalBox(MakeText(UI(*FString::Printf(TEXT("kind_%s"), *E->Kind.ToString())), 16, BylaUI::Accent, true));
		if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeText(E->Title, 23, BylaUI::Text, true)))
		{
			S->SetPadding(FMargin(0.f, 4.f, 0.f, 6.f));
		}
		Box->AddChildToVerticalBox(MakeText(E->Description, 19, BylaUI::TextDim));
		AddContent(MakeCard(Box, BylaUI::Card));
	}
}

void ULaptopWidget::BuildFeedApp(FName Channel)
{
	const UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}
	const bool bMail = Channel == TEXT("mail");
	AddContent(MakeText(UI(bMail ? TEXT("mail_header") : TEXT("krug_header")), 28, BylaUI::Text, true), 18.f);

	const TArray<const FCaseFeedItem*> Items = Case->GetPublishedFeed(Channel);
	if (Items.Num() == 0)
	{
		AddContent(MakeText(UI(TEXT("feed_empty")), 20, BylaUI::TextDim));
		return;
	}

	for (const FCaseFeedItem* Item : Items)
	{
		UVerticalBox* Box = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		UHorizontalBox* Top = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
		Top->AddChildToHorizontalBox(MakeText(Item->Author, 21, BylaUI::Accent, true, false));
		if (UHorizontalBoxSlot* S = Top->AddChildToHorizontalBox(MakeText(FText::FromString(Item->DateLabel), 17, BylaUI::TextDim, false, false)))
		{
			S->SetPadding(FMargin(16.f, 3.f, 0.f, 0.f));
		}
		Box->AddChildToVerticalBox(Top);
		if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeText(Item->Text, 22, BylaUI::Text)))
		{
			S->SetPadding(FMargin(0.f, 8.f, 0.f, 0.f));
		}
		AddContent(MakeCard(Box, BylaUI::Card));
	}
}

void ULaptopWidget::BuildBoardApp()
{
	const UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}

	AddContent(MakeText(UI(TEXT("board_header")), 28, BylaUI::Text, true), 8.f);
	AddContent(MakeText(UI(TEXT("board_help")), 19, BylaUI::TextDim), 18.f);

	// Текущий выбор.
	const FText None = UI(TEXT("board_none"));
	const FText Selection = FText::Format(UI(TEXT("board_selected")),
		SelectedA.IsNone() ? None : EvidenceTitle(SelectedA),
		SelectedB.IsNone() ? None : EvidenceTitle(SelectedB));
	AddContent(MakeCard(MakeText(Selection, 21, BylaUI::Warning, true), BylaUI::Card), 12.f);

	// Карточки.
	AddContent(MakeText(UI(TEXT("board_cards")), 20, BylaUI::Accent, true), 8.f);
	UWrapBox* Cards = WidgetTree->ConstructWidget<UWrapBox>(UWrapBox::StaticClass());
	for (const FName& Id : Case->GetKnownEvidence())
	{
		const bool bSelected = (Id == SelectedA || Id == SelectedB);
		UButton* CardButton = MakeButton(EvidenceTitle(Id), ActSelect, Id, bSelected ? BylaUI::ButtonActive : BylaUI::Button);
		if (UWrapBoxSlot* S = Cards->AddChildToWrapBox(CardButton))
		{
			S->SetPadding(FMargin(0.f, 0.f, 8.f, 8.f));
		}
	}
	AddContent(Cards, 16.f);

	// Типы связи (доступны, когда выбраны обе карточки).
	if (!SelectedA.IsNone() && !SelectedB.IsNone())
	{
		AddContent(MakeText(UI(TEXT("board_link_type")), 20, BylaUI::Accent, true), 8.f);
		UWrapBox* Types = WidgetTree->ConstructWidget<UWrapBox>(UWrapBox::StaticClass());
		for (const TCHAR* Type : LinkTypes)
		{
			if (UWrapBoxSlot* S = Types->AddChildToWrapBox(MakeButton(LinkTypeName(Type), ActLink, FName(Type), BylaUI::Button)))
			{
				S->SetPadding(FMargin(0.f, 0.f, 8.f, 8.f));
			}
		}
		if (UWrapBoxSlot* S = Types->AddChildToWrapBox(MakeButton(UI(TEXT("board_clear")), ActClearSelection, NAME_None, BylaUI::Danger)))
		{
			S->SetPadding(FMargin(0.f, 0.f, 8.f, 8.f));
		}
		AddContent(Types, 16.f);
	}

	// Протянутые нити.
	AddContent(MakeText(UI(TEXT("board_links")), 20, BylaUI::Accent, true), 8.f);
	const TArray<FCaseLink>& Links = Case->GetLinks();
	if (Links.Num() == 0)
	{
		AddContent(MakeText(UI(TEXT("board_no_links")), 19, BylaUI::TextDim), 12.f);
	}
	for (int32 i = 0; i < Links.Num(); ++i)
	{
		const FCaseLink& L = Links[i];
		UHorizontalBox* Row = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
		const FText LinkText = FText::Format(FText::FromString(TEXT("{0}  —  {1}  —  {2}")), EvidenceTitle(L.A), LinkTypeName(L.Type), EvidenceTitle(L.B));
		if (UHorizontalBoxSlot* S = Row->AddChildToHorizontalBox(MakeText(LinkText, 20, BylaUI::Text)))
		{
			S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
			S->SetVerticalAlignment(VAlign_Center);
		}
		Row->AddChildToHorizontalBox(MakeButton(FText::FromString(TEXT("X")), ActUnlink, FName(*FString::FromInt(i)), BylaUI::Danger));
		AddContent(MakeCard(Row, BylaUI::Card), 8.f);
	}

	// Доклад версии.
	AddContent(MakeButton(UI(TEXT("report")), ActReport, NAME_None, BylaUI::ButtonActive), 10.f);
	if (!LastReport.IsEmpty())
	{
		AddContent(MakeCard(MakeText(LastReport, 21, bLastReportAccepted ? BylaUI::Good : BylaUI::Warning, true), BylaUI::Card), 16.f);
	}

	// Принятые версии.
	const TArray<const FCaseHypothesis*> Confirmed = Case->GetConfirmedHypotheses();
	if (Confirmed.Num() > 0)
	{
		AddContent(MakeText(UI(TEXT("board_confirmed")), 20, BylaUI::Accent, true), 8.f);
		for (const FCaseHypothesis* H : Confirmed)
		{
			AddContent(MakeCard(MakeText(H->Title, 20, BylaUI::Text), BylaUI::Card), 8.f);
		}
	}
}

void ULaptopWidget::BuildDecisionsApp()
{
	const UCaseStateSubsystem* Case = GetCase();
	if (!Case)
	{
		return;
	}
	AddContent(MakeText(UI(TEXT("decisions_header")), 28, BylaUI::Text, true), 18.f);

	const TArray<const FCaseDecision*> Available = Case->GetAvailableDecisions();
	if (Available.Num() == 0)
	{
		AddContent(MakeText(UI(TEXT("decisions_none")), 20, BylaUI::TextDim));
		return;
	}

	for (const FCaseDecision* D : Available)
	{
		UVerticalBox* Box = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		if (D->bPointOfNoReturn)
		{
			Box->AddChildToVerticalBox(MakeText(UI(TEXT("decision_pnr")), 17, BylaUI::Danger, true));
		}
		if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeText(D->Prompt, 24, BylaUI::Text, true)))
		{
			S->SetPadding(FMargin(0.f, 6.f, 0.f, 6.f));
		}
		if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeText(D->Description, 19, BylaUI::TextDim)))
		{
			S->SetPadding(FMargin(0.f, 0.f, 0.f, 12.f));
		}
		for (int32 i = 0; i < D->Options.Num(); ++i)
		{
			const FName Payload(*FString::Printf(TEXT("%s#%d"), *D->Id.ToString(), i));
			if (UVerticalBoxSlot* S = Box->AddChildToVerticalBox(MakeButton(D->Options[i].Label, ActDecide, Payload, BylaUI::Button)))
			{
				S->SetPadding(FMargin(0.f, 0.f, 0.f, 8.f));
				S->SetHorizontalAlignment(HAlign_Left);
			}
		}
		AddContent(MakeCard(Box, BylaUI::Card));
	}
}

// ================================================================ Действия

void ULaptopWidget::HandleAction(FName Action, FName Payload)
{
	UCaseStateSubsystem* Case = GetCase();

	if (Action == ActClose)
	{
		if (ADetectivePlayerController* PC = Cast<ADetectivePlayerController>(GetOwningPlayer()))
		{
			PC->CloseLaptop();
		}
		return;
	}

	if (Action == ActApp)
	{
		for (const FAppInfo& Info : Apps)
		{
			if (Payload == FName(Info.Id))
			{
				CurrentApp = Info.App;
			}
		}
		LastReport = FText::GetEmpty();
	}
	else if (Action == ActSelect)
	{
		if (Payload == SelectedA)
		{
			SelectedA = SelectedB;
			SelectedB = NAME_None;
		}
		else if (Payload == SelectedB)
		{
			SelectedB = NAME_None;
		}
		else if (SelectedA.IsNone())
		{
			SelectedA = Payload;
		}
		else if (SelectedB.IsNone())
		{
			SelectedB = Payload;
		}
		else
		{
			SelectedA = Payload;
			SelectedB = NAME_None;
		}
	}
	else if (Action == ActClearSelection)
	{
		SelectedA = NAME_None;
		SelectedB = NAME_None;
	}
	else if (Action == ActLink && Case)
	{
		Case->AddLink(SelectedA, SelectedB, Payload);
		SelectedA = NAME_None;
		SelectedB = NAME_None;
		LastReport = FText::GetEmpty();
	}
	else if (Action == ActUnlink && Case)
	{
		Case->RemoveLink(FCString::Atoi(*Payload.ToString()));
		LastReport = FText::GetEmpty();
	}
	else if (Action == ActReport && Case)
	{
		const FCaseReportResult Result = Case->ReportHypothesis();
		LastReport = Result.Message;
		bLastReportAccepted = Result.bAccepted;
	}
	else if (Action == ActDecide && Case)
	{
		FString DecisionId;
		FString Index;
		if (Payload.ToString().Split(TEXT("#"), &DecisionId, &Index))
		{
			Case->ChooseDecision(FName(*DecisionId), FCString::Atoi(*Index));
		}
	}

	bDirty = true;
}
