# タイ文字ノート

日本語話者向けに、タイ文字の基礎からタイ語をしっかり学べるWebアプリを作るプロジェクトです。

## 目的

タイ語の初心者が、文字・発音・声調の土台を無理なく学べることを目指します。

- タイ文字の読み方
- 子音・母音・声調の基礎
- 文字と独自ローマ字表記の対応
- 中子音・高子音・低子音の分類
- 短母音・長母音・特殊母音の分類
- よく使う単語
- 日常会話フレーズ
- 独自ローマ字表記を使った読み方
- クイズによる復習

## 最初の方向性

まずはWebアプリとして小さく作り、最初からスマホでも使いやすいレスポンシブ設計にします。

Webアプリとして始めながら、将来的にはPWA化やスマホアプリ化も検討できる構成にします。

最初のMVPでは、以下を優先します。

- タイ文字の基礎
- 子音・母音・声調の入門
- 中子音・高子音・低子音の分類学習
- 文字と独自ローマ字表記を結びつける練習
- 独自ローマ字表記付きフラッシュカード
- 4択クイズ
- 学習進捗の保存

MVPは `Minimum Viable Product` の略で、最初に動かして学習体験を確認するための最小版です。

このプロジェクトでは、最初から全機能を作るのではなく、タイ文字カード、独自ローマ字表記、子音分類クイズ、進捗保存を先に作ります。

## デザイン方針

落ち着いた学習ツールとして、集中しやすく、長く使っても疲れにくい画面を目指します。

## 開発

Node.js と npm が使える環境で、以下を実行します。

```bash
npm install
npm run dev
```

ビルド確認は以下です。

```bash
npm run build
```

## ドキュメント

- [プロダクト概要](docs/product.md)
- [機能要件](docs/requirements.md)
- [技術方針](docs/tech-stack.md)
- [学習カリキュラム](docs/learning-path.md)
- [学習コンテンツ設計](docs/content-plan.md)
- [デザイン方針](docs/design-direction.md)
- [ロードマップ](docs/roadmap.md)
- [未決事項・確認したいこと](docs/open-questions.md)
- [意思決定ログ](docs/decisions/001-initial-app-direction.md)
- [プロダクト方向性の決定](docs/decisions/002-product-focus-name-and-design.md)
- [学習方針の決定](docs/decisions/003-learning-method.md)
- [発音表記方式の決定](docs/decisions/004-pronunciation-notation.md)

## 現在の状態

MVPの最初のWebアプリ実装があります。

- タイ文字カード
- 中子音・高子音・低子音の分類表示
- 独自ローマ字表記
- 4択クイズ
- `localStorage` による進捗保存

この環境ではNode.js/npmが入っていないため、ビルド確認はNode.js/npmが使える環境で行います。
