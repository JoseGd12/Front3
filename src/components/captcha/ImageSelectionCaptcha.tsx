import React, { useState, useEffect } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { Button } from '../ui/button';

interface ImageData {
  id: string;
  emoji: string;
  category: string;
  isTarget: boolean;
}

interface ImageSelectionCaptchaProps {
  onValidate: (isValid: boolean) => void;
  className?: string;
}

export function ImageSelectionCaptcha({ onValidate, className = '' }: ImageSelectionCaptchaProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  // Base de datos de imágenes con emojis
  const imageDatabase = {
    vehicles: [
      { emoji: '🚗', name: 'coche' },
      { emoji: '🚙', name: 'SUV' },
      { emoji: '🚐', name: 'furgoneta' },
      { emoji: '🚛', name: 'camión' },
      { emoji: '🏍️', name: 'motocicleta' },
      { emoji: '🚲', name: 'bicicleta' },
    ],
    animals: [
      { emoji: '🐱', name: 'gato' },
      { emoji: '🐶', name: 'perro' },
      { emoji: '🐸', name: 'rana' },
      { emoji: '🐺', name: 'lobo' },
      { emoji: '🦊', name: 'zorro' },
      { emoji: '🐰', name: 'conejo' },
    ],
    food: [
      { emoji: '🍕', name: 'pizza' },
      { emoji: '🍔', name: 'hamburguesa' },
      { emoji: '🍰', name: 'tarta' },
      { emoji: '🍎', name: 'manzana' },
      { emoji: '🥕', name: 'zanahoria' },
      { emoji: '🍌', name: 'plátano' },
    ],
    tools: [
      { emoji: '🔨', name: 'martillo' },
      { emoji: '🔧', name: 'llave inglesa' },
      { emoji: '✂️', name: 'tijeras' },
      { emoji: '🪚', name: 'sierra' },
      { emoji: '🪛', name: 'destornillador' },
      { emoji: '⚒️', name: 'martillo de forja' },
    ],
    nature: [
      { emoji: '🌳', name: 'árbol' },
      { emoji: '🌸', name: 'flor de cerezo' },
      { emoji: '🌺', name: 'hibisco' },
      { emoji: '🌻', name: 'girasol' },
      { emoji: '🌹', name: 'rosa' },
      { emoji: '🍄', name: 'hongo' },
    ]
  };

  const categoryNames = {
    vehicles: 'vehículos',
    animals: 'animales',
    food: 'comida',
    tools: 'herramientas',
    nature: 'elementos de la naturaleza'
  };

  // Generar nuevo desafío
  const generateNewChallenge = () => {
    const categories = Object.keys(imageDatabase);
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)] as keyof typeof imageDatabase;
    
    setTargetCategory(selectedCategory);
    
    // Obtener imágenes de la categoría objetivo (3-4 imágenes)
    const targetImages = imageDatabase[selectedCategory];
    const numTargetImages = Math.min(3 + Math.floor(Math.random() * 2), targetImages.length);
    const selectedTargetImages = targetImages.slice(0, numTargetImages);

    // Obtener imágenes de otras categorías como distractores
    const otherCategories = categories.filter(cat => cat !== selectedCategory);
    const distractorImages: typeof targetImages = [];
    
    otherCategories.forEach(category => {
      const categoryImages = imageDatabase[category as keyof typeof imageDatabase];
      const numFromCategory = Math.min(2, categoryImages.length);
      distractorImages.push(...categoryImages.slice(0, numFromCategory));
    });

    // Mezclar y limitar a 9 imágenes total
    const allImages = [
      ...selectedTargetImages.map(img => ({ ...img, category: selectedCategory, isTarget: true })),
      ...distractorImages.slice(0, 9 - numTargetImages).map(img => ({ ...img, category: 'distractor', isTarget: false }))
    ];

    // Barajar array
    for (let i = allImages.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allImages[i], allImages[j]] = [allImages[j], allImages[i]];
    }

    const imagesWithIds = allImages.map((img, index) => ({
      id: `img-${index}`,
      emoji: img.emoji,
      category: img.category,
      isTarget: img.isTarget
    }));

    setImages(imagesWithIds);
    setSelectedImages(new Set());
    setIsCompleted(false);
    onValidate(false);
  };

  // Manejar selección de imagen
  const handleImageClick = (imageId: string) => {
    if (isCompleted) return;

    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);

    // Verificar si la selección es correcta
    const targetImages = images.filter(img => img.isTarget);
    const selectedTargetIds = targetImages.filter(img => newSelected.has(img.id)).map(img => img.id);
    const selectedNonTargetIds = images.filter(img => !img.isTarget && newSelected.has(img.id));

    // La selección es correcta si:
    // 1. Se han seleccionado todas las imágenes objetivo
    // 2. No se han seleccionado imágenes que no son objetivo
    const isCorrect = selectedTargetIds.length === targetImages.length && selectedNonTargetIds.length === 0;

    if (isCorrect) {
      setIsCompleted(true);
      onValidate(true);
    } else {
      onValidate(false);
    }
  };

  // Verificar selección
  const verifySelection = () => {
    const targetImages = images.filter(img => img.isTarget);
    const selectedTargetIds = targetImages.filter(img => selectedImages.has(img.id));
    const selectedNonTargetIds = images.filter(img => !img.isTarget && selectedImages.has(img.id));

    const isCorrect = selectedTargetIds.length === targetImages.length && selectedNonTargetIds.length === 0;
    
    setAttempts(prev => prev + 1);

    if (isCorrect) {
      setIsCompleted(true);
      onValidate(true);
    } else {
      // Mostrar error temporal y resetear después de 2 segundos
      setTimeout(() => {
        if (attempts >= 2) {
          generateNewChallenge();
          setAttempts(0);
        }
      }, 2000);
      onValidate(false);
    }
  };

  // Generar desafío inicial
  useEffect(() => {
    generateNewChallenge();
  }, []);

  const targetCategoryName = categoryNames[targetCategory as keyof typeof categoryNames] || targetCategory;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="p-4 bg-gray-darker rounded-lg border border-gray-dark">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white-primary font-medium flex items-center gap-2">
            🖼️ Selección de imágenes
          </h4>
          <Button
            type="button"
            onClick={generateNewChallenge}
            className="p-2 bg-gray-medium hover:bg-gray-light rounded-lg transition-colors"
            title="Generar nuevo desafío"
          >
            <RefreshCw className="w-4 h-4 text-gray-lightest" />
          </Button>
        </div>

        {/* Instrucciones */}
        <div className="mb-4 p-3 bg-orange-primary/10 border border-orange-primary/30 rounded-lg">
          <p className="text-orange-primary font-medium text-center">
            Selecciona todas las imágenes que contengan: <span className="font-bold">{targetCategoryName}</span>
          </p>
          {attempts > 0 && !isCompleted && (
            <p className="text-red-400 text-sm text-center mt-2">
              Selección incorrecta. Intento {attempts}/3
            </p>
          )}
        </div>

        {/* Grid de imágenes */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {images.map((image) => (
            <div
              key={image.id}
              onClick={() => handleImageClick(image.id)}
              className={`relative aspect-square bg-gray-darkest rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 flex items-center justify-center text-4xl ${
                selectedImages.has(image.id)
                  ? isCompleted
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-orange-primary bg-orange-900/20'
                  : 'border-gray-dark hover:border-gray-lighter'
              }`}
            >
              <span className="select-none">{image.emoji}</span>
              
              {/* Indicador de selección */}
              {selectedImages.has(image.id) && (
                <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-500' : 'bg-orange-primary'
                }`}>
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Overlay cuando está completado */}
              {isCompleted && (
                <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                  {selectedImages.has(image.id) && image.isTarget && (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botón de verificación */}
        {!isCompleted && selectedImages.size > 0 && (
          <div className="flex justify-center">
            <Button
              onClick={verifySelection}
              className="elegante-button-primary px-6 py-2"
              disabled={selectedImages.size === 0}
            >
              Verificar selección
            </Button>
          </div>
        )}

        {/* Estado */}
        <div className="mt-4 text-sm text-center">
          {isCompleted ? (
            <span className="text-green-400 flex items-center justify-center gap-2">
              ✓ Selección correcta! Verificación completada
            </span>
          ) : selectedImages.size > 0 ? (
            <span className="text-orange-primary">
              {selectedImages.size} imagen{selectedImages.size !== 1 ? 'es' : ''} seleccionada{selectedImages.size !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-gray-lightest">
              Haz clic en las imágenes que contengan <strong>{targetCategoryName}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
