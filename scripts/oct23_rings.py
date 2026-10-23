"""
The AI studio photographs of 2026-10-22 (three Drive folders), sorted into rings.
Each entry: SKU -> list of (folder key, photo index), the cone photograph first: the most
front-on, complete view, used for the ring's cut-out (the velvet cones, cards and lamp).
Indexes are into the sorted file list of each folder in assets/raw/oct23/.

Folder keys: 'a' = "22 ring ai photos" (new photographs of rings 001-021),
             'b' = "Ring 3 ai photos", 'c' = "Ring44" (new rings 024-083).
"""
FOLDERS = {'a': '22 ring ai photos', 'b': 'Ring 3 ai photos', 'c': 'Ring44'}

A = lambda *ix: [('a', i) for i in ix]
B = lambda *ix: [('b', i) for i in ix]
C = lambda *ix: [('c', i) for i in ix]

RINGS = {
    # rings already in the catalogue
    'PLT-RNG-001': A(34, 23, 9),
    'PLT-RNG-002': A(39, 15),
    'PLT-RNG-003': A(37, 32),
    'PLT-RNG-004': A(44, 26, 7, 14),
    'PLT-RNG-005': A(6),
    'PLT-RNG-006': A(47, 31),
    'PLT-RNG-007': A(0, 11, 2, 17, 21),
    'PLT-RNG-008': A(38, 27),
    'PLT-RNG-009': A(45, 10, 33, 36, 46, 18),
    'PLT-RNG-010': A(22, 25),
    'PLT-RNG-011': A(43, 8),
    'PLT-RNG-012': A(40, 5),
    'PLT-RNG-013': A(28, 30, 19),
    'PLT-RNG-014': A(42),
    'PLT-RNG-015': A(16),
    'PLT-RNG-016': A(41, 3, 4),
    'PLT-RNG-017': A(13, 12),
    'PLT-RNG-018': A(1),
    'PLT-RNG-019': A(35, 24),
    'PLT-RNG-020': A(29),
    'PLT-RNG-021': A(20),
    # new rings
    'PLT-RNG-024': B(51, 0, 36, 80),
    'PLT-RNG-025': B(57, 75),
    'PLT-RNG-026': B(63, 1, 99),
    'PLT-RNG-027': B(2),
    'PLT-RNG-028': B(47, 40, 41, 25),
    'PLT-RNG-029': B(55, 3, 58, 101),
    'PLT-RNG-030': B(4),
    'PLT-RNG-031': B(70, 26, 103),
    'PLT-RNG-032': B(17, 5, 84),
    'PLT-RNG-033': B(29, 6, 45),
    'PLT-RNG-034': B(28, 13, 7),
    'PLT-RNG-035': B(12, 8),
    'PLT-RNG-036': B(11, 9),
    'PLT-RNG-037': B(62, 10, 92),
    'PLT-RNG-038': B(64, 14, 50),
    'PLT-RNG-039': B(27, 15, 48),
    'PLT-RNG-040': B(43, 16, 39),
    'PLT-RNG-041': B(60, 19, 18),
    'PLT-RNG-042': B(20),
    'PLT-RNG-043': B(106, 21, 76),
    'PLT-RNG-044': B(34, 22),
    'PLT-RNG-045': B(104, 23, 79),
    'PLT-RNG-046': B(86, 52, 24),
    'PLT-RNG-047': B(77, 30),
    'PLT-RNG-048': B(31, 90, 32),
    'PLT-RNG-049': B(100, 107, 33, 54, 82),
    'PLT-RNG-050': B(89, 35),
    'PLT-RNG-051': B(37),
    'PLT-RNG-052': B(81, 96, 38, 68),
    'PLT-RNG-053': B(83, 91, 42),
    'PLT-RNG-054': B(98, 95, 44),
    'PLT-RNG-055': B(46, 78),
    'PLT-RNG-056': B(102, 49, 56),
    'PLT-RNG-057': B(66, 93, 53),
    'PLT-RNG-058': B(105, 59),
    'PLT-RNG-059': B(61, 69),
    'PLT-RNG-060': B(97, 65),
    'PLT-RNG-061': B(67),
    'PLT-RNG-062': B(88, 94, 71),
    'PLT-RNG-063': B(74, 72),
    'PLT-RNG-064': B(73),
    'PLT-RNG-065': B(87, 85),
    'PLT-RNG-066': C(3, 0),
    'PLT-RNG-067': C(1),
    'PLT-RNG-068': C(2),
    'PLT-RNG-069': C(4),
    'PLT-RNG-070': C(14, 5),
    'PLT-RNG-071': C(15, 6),
    'PLT-RNG-072': C(18, 7, 19),
    'PLT-RNG-073': C(8),
    'PLT-RNG-074': C(9),
    'PLT-RNG-075': C(13, 10),
    'PLT-RNG-076': C(11),
    'PLT-RNG-077': C(12),
    'PLT-RNG-078': C(16),
    'PLT-RNG-079': C(17),
    'PLT-RNG-080': C(20),
    'PLT-RNG-081': C(21),
    'PLT-RNG-082': C(22),
    'PLT-RNG-083': C(23),
}

# After review of the cut-outs: where the marble's reflection survived, the fraction of the
# cut-out's height (from the top) below which it is removed.
TRIM: dict[str, float] = {
    'PLT-RNG-005': 0.45, 'PLT-RNG-007': 0.56, 'PLT-RNG-010': 0.47, 'PLT-RNG-020': 0.5,
    'PLT-RNG-021': 0.55, 'PLT-RNG-024': 0.5, 'PLT-RNG-025': 0.5, 'PLT-RNG-029': 0.43,
    'PLT-RNG-037': 0.52, 'PLT-RNG-039': 0.5, 'PLT-RNG-041': 0.45, 'PLT-RNG-045': 0.45,
    'PLT-RNG-050': 0.5, 'PLT-RNG-051': 0.52, 'PLT-RNG-058': 0.56, 'PLT-RNG-079': 0.52,
    'PLT-RNG-080': 0.5,
}
