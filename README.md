# expert_system

## Installation

Install Node, then run in project root directory:

`npm install`

## Usage

### Command Line

`node src/index.js [-v] filename`

### Server

`npm run server`

Open `localhost:8080` for interactive user interface

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

### Examples

1.
```
B + C => A
D | E => B
B => C
=E
?A
```
Output: 
```
=== Queried FACTS ===
A: true
```
2.
```
A => B | C
=A
?B
```
Output: 
```
=== Queried FACTS ===
B: ambiguous
```
3. 
```
A => B
A => !B
=A
?B
```
Output: 
```
=== Queried FACTS ===
B: undefined (contradiction)
```

