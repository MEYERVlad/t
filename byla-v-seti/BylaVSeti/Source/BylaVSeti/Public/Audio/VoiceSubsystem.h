#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "VoiceSubsystem.generated.h"

class UAudioComponent;

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
	/** Проиграть реплику (предыдущая останавливается). Возвращает false, если файла нет или озвучка выключена. */
	bool Play(FName VoiceId);
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
};
