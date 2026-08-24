package com.kit.core.designsystem.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

/**
 * Responsive action button group.
 * Automatically distributes width with weight(1f) in horizontal mode or stacks vertically when requested.
 */
@Composable
fun ResponsiveActionRow(
    primaryLabel: String,
    onPrimaryClick: () -> Unit,
    secondaryLabel: String,
    onSecondaryClick: () -> Unit,
    modifier: Modifier = Modifier,
    tertiaryLabel: String? = null,
    onTertiaryClick: (() -> Unit)? = null
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Button(
            onClick = onPrimaryClick,
            modifier = Modifier.weight(1f)
        ) {
            Text(text = primaryLabel, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }

        OutlinedButton(
            onClick = onSecondaryClick,
            modifier = Modifier.weight(1f)
        ) {
            Text(text = secondaryLabel, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }

        if (tertiaryLabel != null && onTertiaryClick != null) {
            OutlinedButton(
                onClick = onTertiaryClick,
                modifier = Modifier.weight(1f)
            ) {
                Text(text = tertiaryLabel, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

/**
 * Vertical button group for bottom sheets, alert dialogs, and high-emphasis action flows.
 */
@Composable
fun ResponsiveActionColumn(
    primaryLabel: String,
    onPrimaryClick: () -> Unit,
    secondaryLabel: String? = null,
    onSecondaryClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Button(
            onClick = onPrimaryClick,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = primaryLabel, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }

        if (secondaryLabel != null && onSecondaryClick != null) {
            OutlinedButton(
                onClick = onSecondaryClick,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(text = secondaryLabel, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}
