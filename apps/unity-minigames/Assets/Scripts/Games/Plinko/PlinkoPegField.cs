using System.Collections.Generic;
using UnityEngine;

namespace TheVault.Games.Plinko
{
    // Spawns a triangular peg grid programmatically. Place this on an empty
    // GameObject inside the play field; assign the peg prefab in the
    // Inspector. The grid is centred on this GameObject's local origin.
    //
    // Peg prefab requirements: SpriteRenderer + CircleCollider2D (not
    // trigger). No Rigidbody2D — pegs are static.
    public class PlinkoPegField : MonoBehaviour
    {
        [SerializeField] private GameObject _pegPrefab;

        [Tooltip("Number of peg rows from top to bottom.")]
        [Range(4, 24)] public int Rows = 12;

        [Tooltip("Horizontal spacing between pegs in a row.")]
        public float HorizontalSpacing = 0.55f;

        [Tooltip("Vertical spacing between rows.")]
        public float VerticalSpacing = 0.55f;

        [Tooltip("Pegs in the top row. Each subsequent row adds 1.")]
        [Range(2, 12)] public int TopRowCount = 3;

        private readonly List<GameObject> _spawned = new List<GameObject>();

        public float WidthAtBottom => (TopRowCount + Rows - 2) * HorizontalSpacing;

        public void Build()
        {
            Clear();
            if (_pegPrefab == null)
            {
                Debug.LogError("[PlinkoPegField] Peg prefab not assigned.");
                return;
            }

            for (var row = 0; row < Rows; row++)
            {
                var pegsInRow = TopRowCount + row;
                var rowWidth = (pegsInRow - 1) * HorizontalSpacing;
                var y = -row * VerticalSpacing;
                for (var col = 0; col < pegsInRow; col++)
                {
                    var x = -rowWidth / 2f + col * HorizontalSpacing;
                    var local = new Vector3(x, y, 0f);
                    var peg = Instantiate(_pegPrefab, transform);
                    peg.transform.localPosition = local;
                    _spawned.Add(peg);
                }
            }
        }

        public void Clear()
        {
            foreach (var go in _spawned)
            {
                if (go != null) Destroy(go);
            }
            _spawned.Clear();
        }

        // World-space Y of the row that should host the scoring slots.
        public float BottomY => transform.position.y - (Rows - 1) * VerticalSpacing - VerticalSpacing;
    }
}
