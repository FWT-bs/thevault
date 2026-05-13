using System.Collections.Generic;
using UnityEngine;

namespace TheVault.Core.Pooling
{
    // Bare-bones GameObject pool. Use one instance per prefab. Avoids
    // Instantiate/Destroy on hot paths (Plinko balls, Block Blast tiles,
    // particle bursts).
    public class SimplePool
    {
        private readonly GameObject _prefab;
        private readonly Transform _parent;
        private readonly Queue<GameObject> _free = new Queue<GameObject>();

        public SimplePool(GameObject prefab, int prewarm = 0, Transform parent = null)
        {
            _prefab = prefab;
            _parent = parent;
            for (var i = 0; i < prewarm; i++)
            {
                var go = Object.Instantiate(_prefab, _parent);
                go.SetActive(false);
                _free.Enqueue(go);
            }
        }

        public GameObject Get(Vector3 position, Quaternion rotation)
        {
            GameObject go;
            if (_free.Count > 0)
            {
                go = _free.Dequeue();
                go.transform.SetPositionAndRotation(position, rotation);
            }
            else
            {
                go = Object.Instantiate(_prefab, position, rotation, _parent);
            }
            go.SetActive(true);
            return go;
        }

        public void Release(GameObject go)
        {
            if (go == null) return;
            go.SetActive(false);
            _free.Enqueue(go);
        }
    }
}
