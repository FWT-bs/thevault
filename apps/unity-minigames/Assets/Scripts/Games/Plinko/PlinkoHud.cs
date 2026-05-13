using TMPro;
using UnityEngine;

namespace TheVault.Games.Plinko
{
    // Minimal in-game HUD. Place a Canvas in the scene with two TMP_Text
    // children and wire them up in the Inspector. The React Native side
    // owns the exit button and the post-game result screen; this is just
    // the live score / drops-remaining readout.
    //
    // If you prefer UGUI Text over TMP, swap the field types — the script
    // does not depend on TMP-specific APIs beyond SetText.
    public class PlinkoHud : MonoBehaviour
    {
        [SerializeField] private TMP_Text _scoreLabel;
        [SerializeField] private TMP_Text _dropsLabel;

        public void Bind(PlinkoController owner)
        {
            owner.OnScoreChanged += SetScore;
            owner.OnDropsRemainingChanged += SetDrops;
        }

        public void Unbind(PlinkoController owner)
        {
            owner.OnScoreChanged -= SetScore;
            owner.OnDropsRemainingChanged -= SetDrops;
        }

        private void SetScore(int score)
        {
            if (_scoreLabel != null) _scoreLabel.SetText("{0}", score);
        }

        private void SetDrops(int drops)
        {
            if (_dropsLabel != null) _dropsLabel.SetText("{0}", drops);
        }
    }
}
