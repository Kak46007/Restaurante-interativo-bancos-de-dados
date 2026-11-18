# Modelos 3D

Coloque aqui os arquivos .glb ou .gltf dos pratos.

Arquivos esperados:
- burger.glb
- pizza.glb
- dessert.glb

Para adicionar um modelo a um produto, edite o campo `model3d` em `src/data/products.ts`.

Exemplo:
```
model3d: '/models/burger.glb'
```

Se um produto não tiver modelo 3D ou se o navegador não suportar WebGL,
uma imagem normal será exibida automaticamente como fallback.
