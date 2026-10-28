def find_weak_regions(seq):
    weak_beads = []
    for i in range(len(seq)):
        if seq[i] < 70:
            weak_beads.append(i)
    return weak_beads
#finds beads with a PLDDT score less than 70 and returns their indices in a list.