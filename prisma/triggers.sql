DELIMITER $$

CREATE TRIGGER trg_coursegroup_semester_insert
BEFORE INSERT ON CourseGroup
FOR EACH ROW
BEGIN
    DECLARE vStudyYear INT;

    SELECT studyYear
    INTO vStudyYear
    FROM `Group`
    WHERE id = NEW.groupId;

    IF (vStudyYear = 1 AND NEW.semesterNum NOT IN (1,2))
       OR (vStudyYear = 2 AND NEW.semesterNum NOT IN (3,4))
       OR (vStudyYear = 3 AND NEW.semesterNum NOT IN (5,6))
       OR (vStudyYear = 4 AND NEW.semesterNum NOT IN (7,8))
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid semesterNum for group studyYear';
    END IF;
END$$

CREATE TRIGGER trg_coursegroup_semester_update
BEFORE UPDATE ON CourseGroup
FOR EACH ROW
BEGIN
    DECLARE vStudyYear INT;

    SELECT studyYear
    INTO vStudyYear
    FROM `Group`
    WHERE id = NEW.groupId;

    IF (vStudyYear = 1 AND NEW.semesterNum NOT IN (1,2))
       OR (vStudyYear = 2 AND NEW.semesterNum NOT IN (3,4))
       OR (vStudyYear = 3 AND NEW.semesterNum NOT IN (5,6))
       OR (vStudyYear = 4 AND NEW.semesterNum NOT IN (7,8))
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid semesterNum for group studyYear';
    END IF;
END$$

DELIMITER ;
