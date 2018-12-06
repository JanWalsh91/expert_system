# expert_system

## Installation

`npm install`

## Usage

### Command Line

`node src/index.js [-v] filename`

### Server

`npm run server`

Open `localhost:8080`

### Dev Server

`npm run server-dev`

## Syntax

### Rule

`A => B`            A implies B

`A <=> B`           A iff B

### Initial Facts

`=`                 No initial facts

`=A`                A is true

`=!B`               B is false

### Queries

`?A`                What is A?

### Operators

`A => B + C`        AND

`A | B => C`        OR

`A ^ B => C`        XOR

`!A => B`           NOT

`(A + B) | C => D`  PARENTHESES

### Comments

`A => B #This is a comment`

