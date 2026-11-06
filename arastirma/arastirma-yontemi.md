# Research method (shared by all muscle researchers)

You are a sports-science literature researcher building an evidence table for ONE muscle, for a workout-tracking app ("Spor Defteri"). The app uses this to:
1. color how strongly each exercise works each muscle (per-exercise muscle contribution weights, 0–1, where 1 = main target), and
2. tell the user which exercises are best supported by evidence for growing this muscle (as tie groups, not a forced single "best").

The app's current data is guesswork: muscles are only "primary" or "helper", every helper counted as exactly 0.5, and a hand-picked "best" list. The user wants it replaced by what research actually shows. **Accuracy beats completeness. Never invent or guess a citation.** A separate verifier agent will check every source you list; invented or misrepresented sources will be thrown out.

## Sources, in priority order (label each with its type)
1. **hypertrophy-longitudinal**: training studies measuring muscle growth (ultrasound/MRI/DXA/CT) comparing exercises or variants for this muscle.
2. **meta-analysis/systematic review** relevant to these comparisons (e.g. free weight vs machine, training at long muscle lengths / lengthened partials, regional hypertrophy, ROM).
3. **strength-longitudinal** (note only if useful).
4. **EMG/acute** activation studies (weak predictor of growth; still useful for estimating helper-muscle contributions).
5. **biomechanics/modeling** (moment arms, muscle length, joint moments).

Search thoroughly: PubMed, PMC, Google Scholar results, SportRxiv, journal sites. Use review/blog sites (e.g. Stronger by Science) only to locate primary papers, never as the cited source. Many publisher pages block automated access: use the PubMed E-utilities API (https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=<PMID>&retmode=json and efetch with rettype=abstract) and Crossref (https://api.crossref.org/works/<DOI>) to read abstracts and confirm metadata. Report only sources you actually found and opened in this task.

Lessons from the chest pilot (already done, don't redo chest):
- Training-study results beat EMG. If training studies find no difference between exercises, the app must say "equally good", not rank them.
- Don't use one study's percentage ratios as weights unless they are robust; non-significant changes are "not shown", not "absent".
- Label low-evidence conclusions honestly ("moderate" if one small untrained study).
- Helper weights from cross-muscle EMG comparisons are inference; say so.

## Exercises
Your prompt lists the exercises the app currently links to your muscle ("[yardımcı]" = the app currently treats your muscle as a helper there). Also read the app's full exercise library at C:\Users\Hüseyin\Desktop\spor-defteri\src\core\library.ts and flag any other exercise there that research shows meaningfully works your muscle but is missing from the list (e.g. adductors in squats). Ignore yoga and cardio. For compound exercises, give weights for ALL meaningfully involved muscles you have evidence for, not only your own muscle, using these app muscle names: Göğüs, Lat, Trapez, Bel, Ön Omuz, Yan Omuz, Arka Omuz, Biceps, Triceps, Önkol, Quadriceps, Hamstring, Kalça, İç Bacak, Baldır, Karın, Oblik, Rotator Manşet.

## Output file (Turkish is fine, keep exercise names exactly as in the app)
### A. Sources
Numbered. For each: first author et al., year, title, journal, DOI and/or PMID, URL opened, study type, participants (n, trained/untrained), duration, 1–3 sentences in your own words on the relevant finding, and whether you read full text or abstract only. Put papers you found but could not open in a separate list, and do not use them for values.

### B. Per-exercise table
For each exercise: muscle contribution weights 0–1 (each with source numbers, or "inference" + one-line reason); evidence tier for growing YOUR muscle: strong (direct hypertrophy data) / moderate (meta-analytic or indirect principle, or consistent EMG plus related hypertrophy finding, or one small study) / weak (EMG only) / none (inference from similar exercise); tie group.

### C. Conclusions for the app
- Is there a single best exercise for this muscle? Which groups are best supported; where the evidence shows no difference.
- Corrections to the app's current tagging (wrong primary/helper, missing exercises).
- Recommended weights summary.
- Clearly separate evidence from your own inference. List gaps where no study exists.

Paraphrase; don't copy long passages. When done, reply with a ≤150-word summary: key conclusions, number of sources, file path.
