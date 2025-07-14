const fs = require('fs');
const path = require('path');

console.log('🔧 Исправление финальных ошибок в схеме Prisma...');

const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');

try {
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('✅ Добавление недостающих enum и моделей...');
    
    // Добавляем недостающие enum;
    const missingEnums = `;
enum TaskPriority {
  LOW;
  NORMAL;
  HIGH;
  URGENT;
}

enum MovementType {
  RECEIVE;
  ISSUE;
  TRANSFER;
  RETURN;
  ADJUSTMENT;
}

enum MovementStatus {
  PENDING;
  COMPLETED;
  CANCELLED;
}
`;

    // Добавляем модель Movement;
    const movementModel = `;
model Movement {
  id          String        @id @default(cuid());
  type        MovementType;
  status      MovementStatus @default(PENDING);
  quantity    Float;
  notes       String?;
  createdAt   DateTime      @default(now());
  updatedAt   DateTime      @updatedAt;
  // Связи;
  userId      String;
  user        User          @relation("fields": [userId], "references": [id]);
  machineId   String?;
  machine     Machine?      @relation("fields": [machineId], "references": [id]);
  itemId      String?;
  item        Item?         @relation("fields": [itemId], "references": [id]);
  @@map("movements");
}
`;

    // Проверяем, есть ли уже enum TaskPriority;
    if (!schema.includes('enum TaskPriority')) {
        // Находим место после других enum;
        const enumInsertPoint = schema.lastIndexOf('enum ');
        if (enumInsertPoint !== -1) {
            const nextLineAfterEnum = schema.indexOf('\n}', enumInsertPoint) + 2;
            schema = schema.slice(0, nextLineAfterEnum) + '\n' + missingEnums + schema.slice(nextLineAfterEnum);
        } else {
            // Если нет других enum, добавляем в начало после generator;
            const generatorEnd = schema.indexOf('}\n\n') + 3;
            schema = schema.slice(0, generatorEnd) + missingEnums + '\n' + schema.slice(generatorEnd);
        }
    }
    
    // Проверяем, есть ли уже модель Movement;
    if (!schema.includes('model Movement')) {
        // Добавляем модель Movement в конец;
        schema += '\n' + movementModel;
    }
    
    // Исправляем связи в модели Item, если она есть;
    if (schema.includes('model Item')) {
        if (!schema.includes('movements   Movement[]')) {
            schema = schema.replace(;
                /model Item \{[\s\S]*?\n\}/,;
                (match) => {
                    if (!match.includes('movements   Movement[]')) {
                        return match.replace(/(\n  @@map\("items"\)\n\})/, '\n  movements   Movement[]\n$1');
                    }
                    return match;
                }
            );
        }
    }
    
    console.log('✅ Сохранение исправленной схемы...');
    fs.writeFileSync(schemaPath, schema);
    
    console.log('🎉 Все ошибки в схеме Prisma исправлены!');
    console.log('📁 Обновлен файл: backend/prisma/schema.prisma');
    
} catch (error) {
    console.error('❌ Ошибка при исправлении схемы:', error.message);
    process.exit(1);
}
