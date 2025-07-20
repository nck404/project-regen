
---

# Web Novel Story Engine - NENL

This engine allows you to create simple visual novel stories for the web using a plain-text script and character images.

---

## 📁 File Structure

```
project/
├── load.html                     ← Main loader page
├── story/
│   └── 1.txt                     ← Chapter script files
├── char.json                     ← Character-to-avatar mapping
├── img/
│   ├── scen/                     ← Background images
│   └── avt/                      ← Character images
├── bgm/
│   └── *.mp3                     ← Background music
```

---

## Story Script Format (`story/1.txt`)

Write your story using these commands:

### 1. `#scene` – Change Background

```txt
#scene ./img/scen/rooftop.jpg
```

Changes the background image.

---

### 2. `#music` – Play/Stop Background Music

```txt
#music idks.mp3      ← play music
#music stop          ← stop current music
```

---

### 3. Dialogue Line

```txt
[CharacterName] Your dialogue goes here.
```

Character name appears above the dialogue box. You can also use `*action*` for emotions.

Example:

```txt
[Lena] I never thought it would come to this...
[Lena] *sigh* It's the project... I messed up.
```

---

## Character Avatar Format

### `char.json`

Maps character names to avatar images:

```json
{
  "Lena": "./img/avt/frenda.png",
  "Kai": "./img/avt/kai.png",
  "Null": "./img/avt/kai.png"
}
```

* Use `"Null"` if you want to hide the avatar (optional).

---

## Load Story by Chapter

You can load a chapter using:

```
load.html?chap=1
```

Which will load:

```
story/1.txt
```

---

