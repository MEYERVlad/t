#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Case/CaseTypes.h"
#include "CaseStateSubsystem.generated.h"

/** Итог доклада версии с доски «СЛЕД». */
struct FCaseReportResult
{
	bool bAccepted = false;
	FText Message;
};

/** Итог предъявления улики на допросе. */
struct FCasePresentResult
{
	bool bCorrect = false;
	bool bFinished = false;
	FText Reaction;
};

/**
 * Сердце расследования: данные дела (из JSON) и состояние игрока.
 * Улики, флаги, доверие начальства, посты по таймерам, доска «СЛЕД», решения, сохранение.
 */
UCLASS()
class BYLAVSETI_API UCaseStateSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	DECLARE_MULTICAST_DELEGATE_OneParam(FOnCaseId, FName);
	DECLARE_MULTICAST_DELEGATE(FOnCaseChanged);

	/** Новая улика. */
	FOnCaseId OnEvidenceAdded;
	/** Новый пост или письмо. */
	FOnCaseId OnFeedPublished;
	/** Любое изменение состояния (для перерисовки интерфейса). */
	FOnCaseChanged OnCaseChanged;

	virtual void Initialize(FSubsystemCollectionBase& Collection) override;
	virtual void Deinitialize() override;

	/** Сбрасывает состояние и запускает дело (флаг "start"). */
	void StartNewCase();
	bool SaveCase() const;
	bool LoadCase();

	// --- Тексты интерфейса (ui_strings.json) ---
	FText UI(FName Key) const;

	// --- Улики ---
	void AddEvidence(FName Id);
	bool HasEvidence(FName Id) const { return KnownEvidence.Contains(Id); }
	const FCaseEvidence* FindEvidence(FName Id) const { return Evidence.Find(Id); }
	const TArray<FName>& GetKnownEvidence() const { return KnownEvidence; }

	// --- Флаги ---
	void SetFlag(FName Flag);
	bool HasFlag(FName Flag) const { return Flag.IsNone() || Flags.Contains(Flag); }

	// --- Доверие начальства (0..100) ---
	int32 GetTrust() const { return Trust; }
	void ChangeTrust(int32 Delta);

	// --- Лента и почта ---
	/** Опубликованные записи канала, новые первыми. */
	TArray<const FCaseFeedItem*> GetPublishedFeed(FName Channel) const;
	const FCaseFeedItem* FindFeedItem(FName Id) const;

	// --- Доска «СЛЕД» ---
	void AddLink(FName A, FName B, FName Type);
	void RemoveLink(int32 Index);
	const TArray<FCaseLink>& GetLinks() const { return Links; }
	/** Позиция карточки на доске (если игрок не двигал — место по сетке). */
	FVector2D GetCardPosition(FName Id) const;
	void SetCardPosition(FName Id, const FVector2D& Position);
	FCaseReportResult ReportHypothesis();
	TArray<const FCaseHypothesis*> GetConfirmedHypotheses() const;

	// --- Решения ---
	TArray<const FCaseDecision*> GetAvailableDecisions() const;
	void ChooseDecision(FName DecisionId, int32 OptionIndex);

	// --- Предметы в мире ---
	FText GetObjectPrompt(FName ObjectId) const;
	/**
	 * Возвращает true, если предмет сработал. В OutMessage — текст для игрока.
	 * Если предмет открывает допрос, его Id будет в OutInterrogation.
	 */
	bool UseObject(FName ObjectId, FText& OutMessage, FName& OutInterrogation);

	// --- Допросы ---
	const FCaseInterrogation* FindInterrogation(FName Id) const;
	/** Показания, которые сейчас видны игроку (с учётом RequiresStatement). */
	TArray<const FCaseStatement*> GetVisibleStatements(FName InterrogationId) const;
	bool IsStatementBroken(FName InterrogationId, FName StatementId) const;
	bool IsInterrogationFinished(FName InterrogationId) const { return FinishedInterrogations.Contains(InterrogationId); }
	FCasePresentResult PresentEvidence(FName InterrogationId, FName StatementId, FName EvidenceId);

private:
	void LoadData();
	void ScheduleFeedForFlag(FName Flag);
	void PublishFeedItem(FName Id);
	void ClearTimers();
	void MarkChanged();
	static FName StatementKey(FName InterrogationId, FName StatementId);

	// Данные дела
	TMap<FName, FCaseEvidence> Evidence;
	TArray<FCaseFeedItem> FeedItems;
	TArray<FCaseHypothesis> Hypotheses;
	TArray<FCaseDecision> Decisions;
	TMap<FName, FCaseObject> Objects;
	TArray<FCaseInterrogation> Interrogations;
	TMap<FName, FText> UIStrings;

	// Состояние игрока
	TArray<FName> KnownEvidence;
	TSet<FName> Flags;
	TArray<FName> PublishedFeed;
	TSet<FName> ScheduledFeed;
	TArray<FCaseLink> Links;
	TArray<FName> ConfirmedHypotheses;
	TArray<FName> DecidedDecisions;
	TSet<FName> UsedObjects;
	TSet<FName> BrokenStatements;
	TSet<FName> FinishedInterrogations;
	TMap<FName, FVector2D> CardPositions;
	int32 Trust = 60;
	bool bLinksChangedSinceReport = true;

	TArray<FTimerHandle> FeedTimers;
};
