#pragma once

#include "CoreMinimal.h"
#include "Fonts/SlateFontInfo.h"
#include "Styling/CoreStyle.h"

/** Общие цвета и шрифты интерфейса «госсистемы». Крупный текст: читаемо на стриме в 720p. */
namespace BylaUI
{
	inline const FLinearColor Background(0.030f, 0.035f, 0.045f, 0.97f);
	inline const FLinearColor Panel(0.060f, 0.068f, 0.082f, 1.f);
	inline const FLinearColor Card(0.095f, 0.105f, 0.125f, 1.f);
	inline const FLinearColor Button(0.16f, 0.18f, 0.21f, 1.f);
	inline const FLinearColor ButtonActive(0.20f, 0.36f, 0.62f, 1.f);
	inline const FLinearColor Danger(0.55f, 0.12f, 0.10f, 1.f);
	inline const FLinearColor Text(0.90f, 0.91f, 0.93f, 1.f);
	inline const FLinearColor TextDim(0.60f, 0.63f, 0.68f, 1.f);
	inline const FLinearColor Accent(0.45f, 0.70f, 1.00f, 1.f);
	inline const FLinearColor Warning(1.00f, 0.72f, 0.30f, 1.f);
	inline const FLinearColor Good(0.45f, 0.85f, 0.55f, 1.f);

	inline FSlateFontInfo Font(int32 Size, bool bBold = false)
	{
		return FCoreStyle::GetDefaultFontStyle(bBold ? "Bold" : "Regular", Size);
	}
}
