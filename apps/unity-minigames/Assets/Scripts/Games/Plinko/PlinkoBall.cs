using UnityEngine;

namespace TheVault.Games.Plinko
{
    // Drop-in component for the ball prefab. Required components on the
    // prefab GameObject: Rigidbody2D (Dynamic, gravity 1), CircleCollider2D
    // with a PhysicsMaterial2D (bounciness ~0.4, friction 0.05) and a small
    // mass (~0.2). The ball is pooled by PlinkoController via SimplePool;
    // OnDespawn() resets its physics state before returning to the pool.
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(CircleCollider2D))]
    public class PlinkoBall : MonoBehaviour
    {
        private Rigidbody2D _rb;
        private PlinkoController _owner;
        private bool _scored;

        // Optional kill plane below the slots. If a ball misses every slot
        // (clipped through, edge-case) the controller can despawn it after
        // this many seconds.
        public float MaxLifetimeSeconds = 8f;
        private float _spawnedAt;

        public void Bind(PlinkoController owner)
        {
            _owner = owner;
            _rb = GetComponent<Rigidbody2D>();
            _scored = false;
            _spawnedAt = Time.time;
            _rb.linearVelocity = Vector2.zero;
            _rb.angularVelocity = 0f;
            _rb.rotation = 0f;
        }

        public void NotifyScored() => _scored = true;

        private void Update()
        {
            if (_owner == null) return;
            if (Time.time - _spawnedAt > MaxLifetimeSeconds)
            {
                if (!_scored) _owner.OnBallLost(this);
                else _owner.OnBallDespawn(this);
            }
        }

        public void ResetPhysics()
        {
            if (_rb == null) _rb = GetComponent<Rigidbody2D>();
            _rb.linearVelocity = Vector2.zero;
            _rb.angularVelocity = 0f;
        }
    }
}
