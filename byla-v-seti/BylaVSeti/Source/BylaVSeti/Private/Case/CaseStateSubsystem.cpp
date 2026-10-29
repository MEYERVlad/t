#include "Case/CaseStateSubsystem.h"

#include "Case/CaseSaveGame.h"
#include "Dom/JsonObject.h"
#include "Engine/GameInstance.h"
#include "JsonObjectConverter.h"
#include "Kismet/GameplayStatics.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "TimerManager.h"

DEFINE_LOG_CATEGORY_STATIC(LogCase, Log, All);

namespace CaseData
{
	static const TCHAR* SaveSlot = TEXT("case_autosave");
	static const FName StartFlag(TEXT("start"));
	static constexpr int32 WrongReportPenalty = 10;
	static constexpr int32 WrongPresentPenalty = 5;

	// Сетка карточек на доске по умолчанию.
	static constexpr float CardGridX = 250.f;
	static constexpr float CardGridY = 112.f;
	static constexpr int32 CardColumns = 4;

	static FString DataPath(const TCHAR* File)
	{
		return FPaths::ProjectContentDir() / TEXT("Data/Case") / File;
	}

	template <typename T>
	static void LoadArray(const TCHAR* File, TArray<T>& Out)
	{
		FString Json;
		const FString Path = DataPath(File);
		if (!FFileHelper::LoadFileToString(Json, *Path))
		{
			UE_LOG(LogCase, Error, TEXT("Cannot read case data file %s"), *Path);
			return;
		}
		if (!FJsonObjectConverter::JsonArrayStringToUStruct(Json, &Out, 0, 0))
		{
			UE_LOG(LogCase, Error, TEXT("JSON error in %s"), *Path);
		}
	}
}

void UCaseStateSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	LoadData();
}

void UCaseStateSubsystem::Deinitialize()
{
	ClearTimers();
	Super::Deinitialize();
}

void UCaseStateSubsystem::LoadData()
{
	TArray<FCaseEvidence> EvidenceList;
	CaseData::LoadArray(TEXT("evidence.json"), EvidenceList);
	for (const FCaseEvidence& E : EvidenceList)
	{
		Evidence.Add(E.Id, E);
	}

	CaseData::LoadArray(TEXT("feed.json"), FeedItems);
	CaseData::LoadArray(TEXT("hypotheses.json"), Hypotheses);
	CaseData::LoadArray(TEXT("decisions.json"), Decisions);

	TArray<FCaseObject> ObjectList;
	CaseData::LoadArray(TEXT("objects.json"), ObjectList);
	for (const FCaseObject& O : ObjectList)
	{
		Objects.Add(O.Id, O);
	}

	FString Json;
	if (FFileHelper::LoadFileToString(Json, *CaseData::DataPath(TEXT("ui_strings.json"))))
	{
		TSharedPtr<FJsonObject> Root;
		const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
		if (FJsonSerializer::Deserialize(Reader, Root) && Root.IsValid())
		{
			for (const auto& Pair : Root->Values)
			{
				FString Value;
				if (Pair.Value.IsValid() && Pair.Value->TryGetString(Value))
				{
					UIStrings.Add(FName(*Pair.Key), FText::FromString(Value));
				}
			}
		}
	}

	CaseData::LoadArray(TEXT("interrogations.json"), Interrogations);
	CaseData::LoadArray(TEXT("endings.json"), Endings);
	CaseData::LoadArray(TEXT("hints.json"), Hints);
	LastProgressTime = FPlatformTime::Seconds();

	UE_LOG(LogCase, Log, TEXT("Case loaded: evidence %d, feed %d, hypotheses %d, decisions %d, objects %d, interrogations %d, ui strings %d"),
		Evidence.Num(), FeedItems.Num(), Hypotheses.Num(), Decisions.Num(), Objects.Num(), Interrogations.Num(), UIStrings.Num());
}

FText UCaseStateSubsystem::UI(FName Key) const
{
	if (const FText* Found = UIStrings.Find(Key))
	{
		return *Found;
	}
	return FText::FromName(Key);
}

void UCaseStateSubsystem::StartNewCase()
{
	ClearTimers();
	KnownEvidence.Reset();
	Flags.Reset();
	PublishedFeed.Reset();
	ScheduledFeed.Reset();
	Links.Reset();
	ConfirmedHypotheses.Reset();
	DecidedDecisions.Reset();
	UsedObjects.Reset();
	BrokenStatements.Reset();
	FinishedInterrogations.Reset();
	CardPositions.Reset();
	ReachedEnding = NAME_None;
	Trust = 60;
	bLinksChangedSinceReport = true;

	for (const auto& Pair : Evidence)
	{
		if (Pair.Value.bStartsKnown)
		{
			KnownEvidence.Add(Pair.Key);
		}
	}

	SetFlag(CaseData::StartFlag);
	MarkChanged();
}

// ---------------------------------------------------------------- Улики и флаги

void UCaseStateSubsystem::AddEvidence(FName Id)
{
	if (Id.IsNone() || KnownEvidence.Contains(Id))
	{
		return;
	}
	if (!Evidence.Contains(Id))
	{
		UE_LOG(LogCase, Warning, TEXT("Unknown evidence: %s"), *Id.ToString());
		return;
	}
	KnownEvidence.Add(Id);
	OnEvidenceAdded.Broadcast(Id);
	MarkChanged();
}

void UCaseStateSubsystem::SetFlag(FName Flag)
{
	if (Flag.IsNone() || Flags.Contains(Flag))
	{
		return;
	}
	Flags.Add(Flag);
	LastProgressTime = FPlatformTime::Seconds();
	UE_LOG(LogCase, Log, TEXT("Flag set: %s"), *Flag.ToString());
	ScheduleFeedForFlag(Flag);
	CheckEndings(Flag);
	MarkChanged();
}

void UCaseStateSubsystem::ChangeTrust(int32 Delta)
{
	if (Delta == 0)
	{
		return;
	}
	Trust = FMath::Clamp(Trust + Delta, 0, 100);
	MarkChanged();
}

// ---------------------------------------------------------------- Лента

void UCaseStateSubsystem::ScheduleFeedForFlag(FName Flag)
{
	UGameInstance* GI = GetGameInstance();
	for (const FCaseFeedItem& Item : FeedItems)
	{
		if (Item.TriggerFlag != Flag || ScheduledFeed.Contains(Item.Id) || PublishedFeed.Contains(Item.Id))
		{
			continue;
		}
		ScheduledFeed.Add(Item.Id);

		if (Item.DelaySeconds <= 0.f || !GI)
		{
			PublishFeedItem(Item.Id);
		}
		else
		{
			FTimerHandle Handle;
			GI->GetTimerManager().SetTimer(Handle,
				FTimerDelegate::CreateUObject(this, &UCaseStateSubsystem::PublishFeedItem, Item.Id),
				Item.DelaySeconds, false);
			FeedTimers.Add(Handle);
		}
	}
}

void UCaseStateSubsystem::PublishFeedItem(FName Id)
{
	const FCaseFeedItem* Item = FeedItems.FindByPredicate([Id](const FCaseFeedItem& I) { return I.Id == Id; });
	if (!Item || PublishedFeed.Contains(Id) || !HasFlag(Item->RequiresFlag)
		|| (!Item->BlockedByFlag.IsNone() && Flags.Contains(Item->BlockedByFlag)))
	{
		return;
	}

	PublishedFeed.Add(Id);
	for (const FName& E : Item->GrantsEvidence)
	{
		AddEvidence(E);
	}
	if (Item->TrustDelta != 0)
	{
		ChangeTrust(Item->TrustDelta);
	}
	OnFeedPublished.Broadcast(Id);
	SetFlag(Item->SetsFlag);
	MarkChanged();
}

const FCaseFeedItem* UCaseStateSubsystem::FindFeedItem(FName Id) const
{
	return FeedItems.FindByPredicate([Id](const FCaseFeedItem& I) { return I.Id == Id; });
}

TArray<const FCaseFeedItem*> UCaseStateSubsystem::GetPublishedFeed(FName Channel) const
{
	TArray<const FCaseFeedItem*> Result;
	for (int32 i = PublishedFeed.Num() - 1; i >= 0; --i)
	{
		const FName Id = PublishedFeed[i];
		const FCaseFeedItem* Item = FeedItems.FindByPredicate([Id](const FCaseFeedItem& I) { return I.Id == Id; });
		if (Item && Item->Channel == Channel)
		{
			Result.Add(Item);
		}
	}
	return Result;
}

// ---------------------------------------------------------------- Доска «СЛЕД»

void UCaseStateSubsystem::AddLink(FName A, FName B, FName Type)
{
	if (A.IsNone() || B.IsNone() || A == B || Type.IsNone())
	{
		return;
	}
	FCaseLink NewLink;
	NewLink.A = A;
	NewLink.B = B;
	NewLink.Type = Type;
	for (const FCaseLink& L : Links)
	{
		if (L.Matches(NewLink))
		{
			return;
		}
	}
	Links.Add(NewLink);
	bLinksChangedSinceReport = true;
	MarkChanged();
}

void UCaseStateSubsystem::RemoveLink(int32 Index)
{
	if (Links.IsValidIndex(Index))
	{
		Links.RemoveAt(Index);
		bLinksChangedSinceReport = true;
		MarkChanged();
	}
}

FVector2D UCaseStateSubsystem::GetCardPosition(FName Id) const
{
	if (const FVector2D* Found = CardPositions.Find(Id))
	{
		return *Found;
	}
	const int32 Index = FMath::Max(0, KnownEvidence.IndexOfByKey(Id));
	return FVector2D(
		20.f + (Index % CaseData::CardColumns) * CaseData::CardGridX,
		24.f + (Index / CaseData::CardColumns) * CaseData::CardGridY);
}

void UCaseStateSubsystem::SetCardPosition(FName Id, const FVector2D& Position)
{
	CardPositions.Add(Id, Position);
	MarkChanged();
}

FCaseReportResult UCaseStateSubsystem::ReportHypothesis()
{
	FCaseReportResult Result;

	if (Links.Num() == 0)
	{
		Result.Message = UI(TEXT("report_need_links"));
		return Result;
	}
	if (!bLinksChangedSinceReport)
	{
		Result.Message = UI(TEXT("report_nothing_new"));
		return Result;
	}
	bLinksChangedSinceReport = false;

	for (const FCaseHypothesis& H : Hypotheses)
	{
		if (ConfirmedHypotheses.Contains(H.Id) || !HasFlag(H.RequiresFlag) || H.Links.Num() == 0)
		{
			continue;
		}

		bool bAllFound = true;
		for (const FCaseLink& Required : H.Links)
		{
			const bool bFound = Links.ContainsByPredicate([&Required](const FCaseLink& L) { return L.Matches(Required); });
			if (!bFound)
			{
				bAllFound = false;
				break;
			}
		}

		if (bAllFound)
		{
			ConfirmedHypotheses.Add(H.Id);
			// Ловушки принимаются так же, как верные версии: игрок узнает об ошибке позже.
			SetFlag(H.SetsFlag);
			Result.bAccepted = true;
			Result.Message = FText::Format(UI(TEXT("report_ok")), H.Title);
			MarkChanged();
			return Result;
		}
	}

	ChangeTrust(-CaseData::WrongReportPenalty);
	Result.Message = UI(TEXT("report_fail"));
	return Result;
}

TArray<const FCaseHypothesis*> UCaseStateSubsystem::GetConfirmedHypotheses() const
{
	TArray<const FCaseHypothesis*> Result;
	for (const FName& Id : ConfirmedHypotheses)
	{
		if (const FCaseHypothesis* H = Hypotheses.FindByPredicate([Id](const FCaseHypothesis& X) { return X.Id == Id; }))
		{
			Result.Add(H);
		}
	}
	return Result;
}

// ---------------------------------------------------------------- Решения

TArray<const FCaseDecision*> UCaseStateSubsystem::GetAvailableDecisions() const
{
	TArray<const FCaseDecision*> Result;
	for (const FCaseDecision& D : Decisions)
	{
		if (!DecidedDecisions.Contains(D.Id) && HasFlag(D.RequiresFlag))
		{
			Result.Add(&D);
		}
	}
	return Result;
}

void UCaseStateSubsystem::ChooseDecision(FName DecisionId, int32 OptionIndex)
{
	const FCaseDecision* D = Decisions.FindByPredicate([DecisionId](const FCaseDecision& X) { return X.Id == DecisionId; });
	if (!D || DecidedDecisions.Contains(DecisionId) || !D->Options.IsValidIndex(OptionIndex))
	{
		return;
	}
	DecidedDecisions.Add(DecisionId);
	SetFlag(FName(*FString::Printf(TEXT("decided_%s"), *DecisionId.ToString())));
	SetFlag(D->Options[OptionIndex].SetsFlag);
	MarkChanged();
}

// ---------------------------------------------------------------- Предметы

FText UCaseStateSubsystem::GetObjectPrompt(FName ObjectId) const
{
	if (const FCaseObject* O = Objects.Find(ObjectId))
	{
		return O->Prompt;
	}
	return FText::FromName(ObjectId);
}

void UCaseStateSubsystem::SetShowAllObjects(bool bShow)
{
	bShowAllObjects = bShow;
	OnCaseChanged.Broadcast();
}

bool UCaseStateSubsystem::IsObjectVisible(FName ObjectId) const
{
	if (bShowAllObjects)
	{
		return true;
	}
	const FCaseObject* O = Objects.Find(ObjectId);
	return !O || O->ShowFlag.IsNone() || Flags.Contains(O->ShowFlag);
}

bool UCaseStateSubsystem::UseObject(FName ObjectId, FText& OutMessage, FName& OutInterrogation, FName& OutTravelMap)
{
	OutInterrogation = NAME_None;
	OutTravelMap = NAME_None;
	const FCaseObject* O = Objects.Find(ObjectId);
	if (!O)
	{
		UE_LOG(LogCase, Warning, TEXT("Unknown object: %s"), *ObjectId.ToString());
		return false;
	}
	if (!HasFlag(O->RequiresFlag))
	{
		OutMessage = O->LockedMessage;
		return false;
	}
	if (!O->InterrogationId.IsNone())
	{
		OutInterrogation = O->InterrogationId;
		UsedObjects.Add(ObjectId);
		return true;
	}
	if (!O->TravelMap.IsNone())
	{
		OutTravelMap = O->TravelMap;
		OutMessage = O->InspectText;
		UsedObjects.Add(ObjectId);
		SetFlag(O->SetsFlag);
		MarkChanged();
		return true;
	}
	if (O->bOneShot && UsedObjects.Contains(ObjectId))
	{
		OutMessage = O->DoneMessage.IsEmpty() ? O->InspectText : O->DoneMessage;
		return false;
	}

	UsedObjects.Add(ObjectId);
	OutMessage = O->InspectText;
	for (const FName& E : O->EvidenceIds)
	{
		AddEvidence(E);
	}
	SetFlag(O->SetsFlag);
	MarkChanged();
	return true;
}

// ---------------------------------------------------------------- Допросы

FName UCaseStateSubsystem::StatementKey(FName InterrogationId, FName StatementId)
{
	return FName(*FString::Printf(TEXT("%s.%s"), *InterrogationId.ToString(), *StatementId.ToString()));
}

const FCaseInterrogation* UCaseStateSubsystem::FindInterrogation(FName Id) const
{
	return Interrogations.FindByPredicate([Id](const FCaseInterrogation& I) { return I.Id == Id; });
}

bool UCaseStateSubsystem::IsStatementBroken(FName InterrogationId, FName StatementId) const
{
	return BrokenStatements.Contains(StatementKey(InterrogationId, StatementId));
}

TArray<const FCaseStatement*> UCaseStateSubsystem::GetVisibleStatements(FName InterrogationId) const
{
	TArray<const FCaseStatement*> Result;
	if (const FCaseInterrogation* I = FindInterrogation(InterrogationId))
	{
		for (const FCaseStatement& S : I->Statements)
		{
			if (S.RequiresStatement.IsNone() || IsStatementBroken(InterrogationId, S.RequiresStatement))
			{
				Result.Add(&S);
			}
		}
	}
	return Result;
}

FCasePresentResult UCaseStateSubsystem::PresentEvidence(FName InterrogationId, FName StatementId, FName EvidenceId)
{
	FCasePresentResult Result;
	const FCaseInterrogation* I = FindInterrogation(InterrogationId);
	if (!I)
	{
		return Result;
	}
	const FCaseStatement* S = I->Statements.FindByPredicate([StatementId](const FCaseStatement& X) { return X.Id == StatementId; });
	if (!S || IsStatementBroken(InterrogationId, StatementId))
	{
		return Result;
	}

	const bool bContradicts = !EvidenceId.IsNone()
		&& ((!S->ContradictedBy.IsNone() && S->ContradictedBy == EvidenceId) || S->AlsoContradictedBy.Contains(EvidenceId));
	if (bContradicts)
	{
		BrokenStatements.Add(StatementKey(InterrogationId, StatementId));
		Result.bCorrect = true;
		Result.Reaction = S->Reaction;
		for (const FName& E : S->GrantsEvidence)
		{
			AddEvidence(E);
		}
		SetFlag(S->SetsFlag);

		// Все ключевые показания опровергнуты — допрос завершён.
		bool bAllBroken = I->RequiredStatements.Num() > 0;
		for (const FName& Required : I->RequiredStatements)
		{
			bAllBroken &= IsStatementBroken(InterrogationId, Required);
		}
		if (bAllBroken && !FinishedInterrogations.Contains(InterrogationId))
		{
			FinishedInterrogations.Add(InterrogationId);
			for (const FName& E : I->FinishEvidence)
			{
				AddEvidence(E);
			}
			SetFlag(I->FinishFlag);
			Result.bFinished = true;
		}
		MarkChanged();
		return Result;
	}

	ChangeTrust(-CaseData::WrongPresentPenalty);
	Result.Reaction = S->WrongReaction.IsEmpty() ? I->WrongReaction : S->WrongReaction;
	return Result;
}

int32 UCaseStateSubsystem::CountBrokenStatements(FName InterrogationId) const
{
	int32 Count = 0;
	if (const FCaseInterrogation* I = FindInterrogation(InterrogationId))
	{
		for (const FCaseStatement& S : I->Statements)
		{
			Count += IsStatementBroken(InterrogationId, S.Id) ? 1 : 0;
		}
	}
	return Count;
}

int32 UCaseStateSubsystem::CountStatements(FName InterrogationId) const
{
	const FCaseInterrogation* I = FindInterrogation(InterrogationId);
	return I ? I->Statements.Num() : 0;
}

// ---------------------------------------------------------------- Подсказки

const FCaseHint* UCaseStateSubsystem::GetCurrentHint() const
{
	for (const FCaseHint& H : Hints)
	{
		if (!HasFlag(H.RequiresFlag))
		{
			continue;
		}
		bool bDone = false;
		for (const FName& F : H.DoneFlags)
		{
			bDone |= Flags.Contains(F);
		}
		if (!bDone)
		{
			return &H;
		}
	}
	return nullptr;
}

// ---------------------------------------------------------------- Концовки

const FCaseEnding* UCaseStateSubsystem::FindEnding(FName Id) const
{
	return Endings.FindByPredicate([Id](const FCaseEnding& E) { return E.Id == Id; });
}

void UCaseStateSubsystem::CheckEndings(FName Flag)
{
	if (!ReachedEnding.IsNone())
	{
		return;
	}
	for (const FCaseEnding& E : Endings)
	{
		if (E.TriggerFlag != Flag)
		{
			continue;
		}
		bool bMatch = true;
		for (const FName& F : E.RequiresAll)
		{
			bMatch &= Flags.Contains(F);
		}
		for (const FName& F : E.RequiresNone)
		{
			bMatch &= !Flags.Contains(F);
		}
		if (!E.ScoreInterrogation.IsNone())
		{
			bMatch &= CountBrokenStatements(E.ScoreInterrogation) >= E.MinScore;
		}
		if (bMatch)
		{
			ReachedEnding = E.Id;
			UE_LOG(LogCase, Log, TEXT("Ending reached: %s"), *E.Id.ToString());
			OnEndingReached.Broadcast(E.Id);
			return;
		}
	}
}

// ---------------------------------------------------------------- Служебное

void UCaseStateSubsystem::ClearTimers()
{
	if (UGameInstance* GI = GetGameInstance())
	{
		for (FTimerHandle& Handle : FeedTimers)
		{
			GI->GetTimerManager().ClearTimer(Handle);
		}
	}
	FeedTimers.Reset();
}

void UCaseStateSubsystem::MarkChanged()
{
	OnCaseChanged.Broadcast();
	SaveCase();
}

bool UCaseStateSubsystem::SaveCase() const
{
	UCaseSaveGame* Save = Cast<UCaseSaveGame>(UGameplayStatics::CreateSaveGameObject(UCaseSaveGame::StaticClass()));
	if (!Save)
	{
		return false;
	}
	Save->KnownEvidence = KnownEvidence;
	Save->Flags = Flags.Array();
	Save->PublishedFeed = PublishedFeed;
	Save->Links = Links;
	Save->ConfirmedHypotheses = ConfirmedHypotheses;
	Save->DecidedDecisions = DecidedDecisions;
	Save->UsedObjects = UsedObjects.Array();
	Save->BrokenStatements = BrokenStatements.Array();
	Save->FinishedInterrogations = FinishedInterrogations.Array();
	Save->CardPositions = CardPositions;
	Save->ReachedEnding = ReachedEnding;
	Save->Trust = Trust;
	return UGameplayStatics::SaveGameToSlot(Save, CaseData::SaveSlot, 0);
}

bool UCaseStateSubsystem::HasSave() const
{
	return UGameplayStatics::DoesSaveGameExist(CaseData::SaveSlot, 0);
}

bool UCaseStateSubsystem::LoadCase()
{
	UCaseSaveGame* Save = Cast<UCaseSaveGame>(UGameplayStatics::LoadGameFromSlot(CaseData::SaveSlot, 0));
	if (!Save)
	{
		return false;
	}
	ClearTimers();
	KnownEvidence = Save->KnownEvidence;
	Flags.Reset();
	Flags.Append(Save->Flags);
	PublishedFeed = Save->PublishedFeed;
	ScheduledFeed.Reset();
	ScheduledFeed.Append(Save->PublishedFeed);
	Links = Save->Links;
	ConfirmedHypotheses = Save->ConfirmedHypotheses;
	DecidedDecisions = Save->DecidedDecisions;
	UsedObjects.Reset();
	UsedObjects.Append(Save->UsedObjects);
	BrokenStatements.Reset();
	BrokenStatements.Append(Save->BrokenStatements);
	FinishedInterrogations.Reset();
	FinishedInterrogations.Append(Save->FinishedInterrogations);
	CardPositions = Save->CardPositions;
	ReachedEnding = Save->ReachedEnding;
	Trust = Save->Trust;
	bLinksChangedSinceReport = true;

	// Посты, которые ждали таймера в момент сохранения, планируем заново.
	for (const FName& Flag : Save->Flags)
	{
		ScheduleFeedForFlag(Flag);
	}
	OnCaseChanged.Broadcast();
	return true;
}
