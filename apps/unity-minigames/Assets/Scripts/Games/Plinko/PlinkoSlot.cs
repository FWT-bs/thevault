using UnityEngine;

namespace TheVault.Games.Plinko
{
    // Sits at the bottom of the play field, one per scoring lane. Required
    // on its GameObject: BoxCollider2D with `Is Trigger` = true. The slot
    // fires its score value to the controller when a PlinkoBall enters.
    [RequireComponent(typeof(BoxCollider2D))]
    public class PlinkoSlot : MonoBehaviour
    {
        [Tooltip("Points awarded when a ball enters this slot.")]
        public int Points = 100;

        [Tooltip("Optional label used by HUD/log. e.g. \"x5\", \"jackpot\".")]
        public string Label;

        private PlinkoController _owner;

        public void Bind(PlinkoController owner) => _owner = owner;

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_owner == null) return;
            var ball = other.GetComponent<PlinkoBall>();
            if (ball == null) return;
            _owner.OnSlotHit(this, ball);
        }
    }
}
