const express = require('express')'''';
const { PrismaClient } = require('@prisma/client')'''''';
router.get(_'/'''';''';
      "where": { "category": 'ingredient' },'''';
      "orderBy": { "name": 'asc''''''';
    console.error('Ошибка получения ингредиентов:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.get(_'/:id''''''';
      return res.status(404).json({ "error": 'Ингредиент не найден''''''';
    console.error('Ошибка получения ингредиента:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.post(_'/''''''';
        "category": 'ingredient''''''';
    console.error('Ошибка создания ингредиента:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''';
'';
}}}}}))))))))))