#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "MusicSubsystem.generated.h"

class UAudioComponent;

/**
 * Фоновая музыка. Треки — звуковые ассеты в папке /Game/Music (WAV, перетащенный в Content/Music).
 *   Theme         — главная тема: меню и все локации, у которых нет своего трека;
 *   L_Office, L_Prichal, ... — свой трек для локации (необязательно);
 *   Interrogation — во время допросов (необязательно);
 *   Ending        — финальный экран (необязательно).
 * Трек играет по кругу, смена — плавная. Нет файла — играет то, что было (или тишина).
 */
UCLASS(config = Game)
class BYLAVSETI_API UMusicSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	/** Трек локации (или Theme). */
	void PlayForLevel(const UObject* WorldContext);
	/** Особый трек (Interrogation, Ending). Нет файла — продолжает играть текущий. */
	void PlaySpecial(const UObject* WorldContext, FName Track);

	bool IsMusicEnabled() const { return bMusicEnabled; }
	float GetVolume() const { return Volume; }
	void SetMusic(bool bEnabled, float InVolume);

private:
	/** Включает первый найденный трек из списка. */
	void PlayFirst(const UObject* WorldContext, std::initializer_list<FName> Tracks);
	void Stop(float FadeSeconds);

	UPROPERTY(config)
	bool bMusicEnabled = true;

	UPROPERTY(config)
	float Volume = 0.35f;

	FName CurrentTrack;
	TWeakObjectPtr<UAudioComponent> Current;
};
