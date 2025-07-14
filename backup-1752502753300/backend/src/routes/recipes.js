const express = require('express')'''';
const { PrismaClient } = require('@prisma/client')'''''';
router.get(_'/'''';''';
      "orderBy": { "createdAt": 'desc''''''';
    console.error('Ошибка получения рецептов:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.get(_'/:id''''''';
      return res.status(404).json({ "error": 'Рецепт не найден''''''';
    console.error('Ошибка получения рецепта:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.post(_'/''''''';
    console.error('Ошибка создания рецепта:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.put(_'/:id''''''';
    console.error('Ошибка обновления рецепта:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.delete(_'/:id''''''';
    console.error('Ошибка удаления рецепта:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''';
'';
}}}}}}}))))))))))))))))