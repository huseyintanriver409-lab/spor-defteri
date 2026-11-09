# Tek tarafli antrenman kaydi

- Hareket bilgisi: src/core/library.ts icindeki UNILATERAL ve isUnilateral. Donusumlu tekrarlarla zaten iki tarafi kapsayan hareketler (bicycle crunch vb.) ikinci kez tekrarlanmaz.
- Sira: sol, sag, sonraki set. Dinlenme, superset gecisi ve PR bildirimi ancak iki taraf bitince calisir. Sureli hareketler ve isinma setleri de ayni sirayi kullanir.
- Ilk taraf state.live.sides icinde saklanir; yenileme ve hareket degistirmede korunur. Henuz tamamlanmis set sayilmaz. Antrenman bitirilirse bu yarim cift tamamlanmis kayda eklenmez.
- Iki taraf = bir set. Mevcut w/r/sec/t/rir alanlari ilk tarafin degerleridir. Hacim eski mantikla w * r olarak bir kez hesaplanir (30 kg x 8 = 240); kas set sayisi, PR ve yuklenme de ayni temsilci kaydi kullanir. Iki tarafin farkli degerleri opsiyonel sides dizisinde saklanir.
- Eski kayitlar aynen kalir; veri semasi veya eski setlerin anlami degismez. Tamamlanmis cift silinirse tek kayit olarak silinir/geri alinir.
