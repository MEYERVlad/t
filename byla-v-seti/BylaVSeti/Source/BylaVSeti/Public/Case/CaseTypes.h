#pragma once

#include "CoreMinimal.h"
#include "CaseTypes.generated.h"

// Все структуры читаются из JSON в Content/Data/Case/.
// Ключи JSON совпадают с именами полей (регистр не важен).

/** Улика / карточка на доске: человек, документ, место, пост, факт. */
USTRUCT(BlueprintType)
struct FCaseEvidence
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Id;

	/** person, document, place, post, fact, statement */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Kind;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Title;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Description;

	/** Известна с начала игры. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	bool bStartsKnown = false;
};

/** Связь между двумя карточками на доске «СЛЕД». Направление не важно. */
USTRUCT(BlueprintType)
struct FCaseLink
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName A;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName B;

	/** points_to, contradicts, alibi, wrote, was_at, owns */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Type;

	bool Matches(const FCaseLink& Other) const
	{
		return Type == Other.Type
			&& ((A == Other.A && B == Other.B) || (A == Other.B && B == Other.A));
	}
};

/** Пост в «Круге» или письмо в почте. Публикуется через DelaySeconds после флага TriggerFlag. */
USTRUCT(BlueprintType)
struct FCaseFeedItem
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Id;

	/** krug или mail */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Channel;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Author;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FString DateLabel;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Text;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName TriggerFlag;

	/** Если задан и не выставлен к моменту публикации — пост не выходит. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName RequiresFlag;

	/** Если этот флаг выставлен к моменту публикации — пост не выходит (например, страница удалена). */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName BlockedByFlag;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	float DelaySeconds = 0.f;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FName> GrantsEvidence;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName SetsFlag;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	int32 TrustDelta = 0;
};

/** Версия, которую можно доложить с доски «СЛЕД». */
USTRUCT(BlueprintType)
struct FCaseHypothesis
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Id;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Title;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FCaseLink> Links;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName RequiresFlag;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName SetsFlag;

	/** Ложная, но логически цельная версия: принимается, последствия приходят позже. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	bool bTrap = false;
};

USTRUCT(BlueprintType)
struct FCaseDecisionOption
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Label;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName SetsFlag;
};

/** Решение игрока (в т.ч. точка невозврата и будущее голосование чата). */
USTRUCT(BlueprintType)
struct FCaseDecision
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Id;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Prompt;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Description;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName RequiresFlag;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	bool bPointOfNoReturn = true;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FCaseDecisionOption> Options;
};

/** Предмет в мире, с которым можно взаимодействовать (папка, телефон, распечатка). */
USTRUCT(BlueprintType)
struct FCaseObject
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Id;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Prompt;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText InspectText;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FName> EvidenceIds;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName SetsFlag;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName RequiresFlag;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText LockedMessage;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText DoneMessage;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	bool bOneShot = true;

	/** Если задан — предмет открывает допрос с этим Id (interrogations.json). */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName InterrogationId;

	/** Если задан — предмет переносит игрока на этот уровень (например, L_IrinaFlat). */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName TravelMap;

	/** Если задан — предмет (или человек) виден в мире только после этого флага. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName ShowFlag;
};

/**
 * Концовка. Проверяется, когда выставлен TriggerFlag; срабатывает первая подходящая по порядку в endings.json.
 * Очки — число опровергнутых показаний в допросе ScoreInterrogation (вопросы суда).
 */
USTRUCT(BlueprintType)
struct FCaseEnding
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Id;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Title;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Text;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName TriggerFlag;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FName> RequiresAll;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FName> RequiresNone;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName ScoreInterrogation;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	int32 MinScore = 0;
};

/**
 * Подсказка «что делать дальше». Текущая — первая по порядку в hints.json,
 * у которой выполнен RequiresFlag и не выставлен ни один из DoneFlags.
 */
USTRUCT(BlueprintType)
struct FCaseHint
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Id;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Text;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName RequiresFlag;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FName> DoneFlags;
};

/** Одно показание на допросе. Его можно опровергнуть уликой ContradictedBy. */
USTRUCT(BlueprintType)
struct FCaseStatement
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Id;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Text;

	/** Улика, которая опровергает показание. Пусто — показание правдивое. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName ContradictedBy;

	/** Другие улики, которые тоже опровергают показание (разные пути расследования). */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FName> AlsoContradictedBy;

	/** Что говорит персонаж, когда показание опровергнуто. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Reaction;

	/** Реакция на неверную улику (если пусто — общая реакция допроса). */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText WrongReaction;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FName> GrantsEvidence;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName SetsFlag;

	/** Показание появляется только после того, как опровергнуто это. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName RequiresStatement;
};

/** Реакция персонажа на пост или письмо, пришедшее прямо во время допроса. */
USTRUCT(BlueprintType)
struct FCaseLiveReaction
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName FeedId;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Text;
};

USTRUCT(BlueprintType)
struct FCaseInterrogation
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName Id;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Person;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText Intro;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FCaseStatement> Statements;

	/** Допрос завершён, когда опровергнуты все эти показания. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FName> RequiredStatements;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FName FinishFlag;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FName> FinishEvidence;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText FinishText;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	FText WrongReaction;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Case")
	TArray<FCaseLiveReaction> LiveReactions;
};
