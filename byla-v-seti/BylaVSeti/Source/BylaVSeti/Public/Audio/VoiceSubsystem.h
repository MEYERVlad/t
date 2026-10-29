#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "VoiceSubsystem.generated.h"

class AActor;
class UAnimInstance;
class UAnimMontage;
class UAnimSequenceBase;
class UAudioComponent;
class USkeletalMeshComponent;

/**
 * Озвучка реплик. Звук реплики — ассет /Game/Voice/<Id> (WAV, перетащенный в папку Content/Voice).
 * Нет файла — реплика просто показывается текстом, как раньше. Одновременно звучит одна реплика.
 *
 * Id реплик (их же имена файлов): <допрос>__<показание>, <допрос>__<показание>__yes (признание),
 * <допрос>__<показание>__no и <допрос>__no (неверная улика), <допрос>__live__<пост>. Полный список — VO_SCRIPT.md.
 */
UCLASS(config = Game)
class BYLAVSETI_API UVoiceSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	/**
	 * Проиграть реплику (предыдущая останавливается). Возвращает false, если файла нет или озвучка выключена.
	 * Speaker — персонаж MetaHuman: если есть анимация лица /Game/Voice/Face/<Id>, она играет на его лице.
	 */
	bool Play(FName VoiceId, AActor* Speaker = nullptr);

	/** Включить спокойную анимацию лица (моргание) /Game/Characters/Animations/Face_Idle на персонаже. */
	void StartFaceIdle(AActor* Character);

	/** Найти лицо MetaHuman (компонент Face). */
	static USkeletalMeshComponent* FindFace(AActor* Character);
	void Stop();

	bool IsVoiceEnabled() const { return bVoiceEnabled; }
	void SetVoiceEnabled(bool bEnabled);

	float GetVolume() const { return Volume; }
	void SetVolume(float InVolume);

	static FName StatementId(FName Interrogation, FName Statement);
	static FName ReactionId(FName Interrogation, FName Statement, bool bCorrect, bool bStatementHasOwnWrong);
	static FName LiveId(FName Interrogation, FName FeedId);

private:
	UPROPERTY(config)
	bool bVoiceEnabled = true;

	UPROPERTY(config)
	float Volume = 1.f;

	TWeakObjectPtr<UAudioComponent> Current;

	UFUNCTION()
	void HandleMontageEnded(UAnimMontage* Montage, bool bInterrupted);
	void PlayIdleOn(UAnimInstance* Anim);

	/** Лицо, которое сейчас говорит, и его монтаж речи. */
	TWeakObjectPtr<UAnimInstance> SpeakingFace;
	TWeakObjectPtr<UAnimMontage> SpeakingMontage;

	/** Анимация спокойного лица для каждого персонажа (по его AnimInstance лица). */
	TMap<TWeakObjectPtr<UAnimInstance>, TWeakObjectPtr<UAnimSequenceBase>> IdleFaces;
};
